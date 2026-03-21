import { Response } from "express";
import { EventEmitter } from "events";

export interface StockUpdateEvent {
  itemId: string;
  itemName: string;
  previousQuantity: number;
  newQuantity: number;
  change: number;
  type: "IN" | "OUT" | "ADJUSTMENT" | "TRANSFER";
  timestamp: string;
  userId?: string;
}

class SSEServiceClass extends EventEmitter {
  private clients: Map<string, Response> = new Map();

  constructor() {
    super();
    // Clean up disconnected clients every 5 minutes
    setInterval(() => this.cleanupClients(), 5 * 60 * 1000);
  }

  addClient(clientId: string, res: Response): void {
    this.clients.set(clientId, res);
    console.log(`SSE client connected: ${clientId} (total: ${this.clients.size})`);

    // Send initial connection message
    this.sendToClient(clientId, {
      type: "connected",
      message: "Connected to stock updates",
      timestamp: new Date().toISOString(),
    });
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    console.log(`SSE client disconnected: ${clientId} (total: ${this.clients.size})`);
  }

  private sendToClient(clientId: string, data: unknown): void {
    const res = this.clients.get(clientId);
    if (res && !res.writableEnded) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }

  broadcastStockUpdate(update: StockUpdateEvent): void {
    const message = {
      type: "stock_update",
      data: update,
      timestamp: new Date().toISOString(),
    };

    let removedCount = 0;
    this.clients.forEach((res, clientId) => {
      if (res.writableEnded) {
        this.clients.delete(clientId);
        removedCount++;
      } else {
        try {
          res.write(`data: ${JSON.stringify(message)}\n\n`);
        } catch (error) {
          console.error(`Error sending SSE to ${clientId}:`, error);
          this.clients.delete(clientId);
        }
      }
    });

    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} disconnected clients`);
    }

    // Also emit for internal listeners
    this.emit("stock_update", update);
  }

  private cleanupClients(): void {
    const initialSize = this.clients.size;
    this.clients.forEach((res, clientId) => {
      if (res.writableEnded) {
        this.clients.delete(clientId);
      }
    });

    if (this.clients.size !== initialSize) {
      console.log(`SSE cleanup: removed ${initialSize - this.clients.size} disconnected clients`);
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const SSEService = new SSEServiceClass();
