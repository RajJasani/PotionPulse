import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/realtime',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger('EventsGateway');

  handleConnection(client: Socket) {
    this.logger.debug(`Socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('tenant:join')
  handleJoinTenant(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tenantId: string },
  ) {
    if (payload?.tenantId) {
      const room = `tenant:${payload.tenantId}`;
      client.join(room);
      this.logger.debug(`Socket ${client.id} joined room ${room}`);
      return { event: 'tenant:joined', data: { room } };
    }
    return { event: 'error', data: { message: 'Missing tenantId' } };
  }

  @SubscribeMessage('tenant:leave')
  handleLeaveTenant(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tenantId: string },
  ) {
    if (payload?.tenantId) {
      const room = `tenant:${payload.tenantId}`;
      client.leave(room);
      this.logger.debug(`Socket ${client.id} left room ${room}`);
      return { event: 'tenant:left', data: { room } };
    }
    return { event: 'error', data: { message: 'Missing tenantId' } };
  }

  // Tenant-scoped broadcast of committed inventory mutations
  broadcastInventoryUpdate(tenantId: string, data: Record<string, unknown>) {
    if (!this.server) return;
    const room = `tenant:${tenantId}`;
    this.server.to(room).emit('inventory:updated', {
      tenantId,
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  // Tenant-scoped broadcast of completed sales
  broadcastSaleCompleted(tenantId: string, data: Record<string, unknown>) {
    if (!this.server) return;
    const room = `tenant:${tenantId}`;
    this.server.to(room).emit('sale:completed', {
      tenantId,
      timestamp: new Date().toISOString(),
      ...data,
    });
  }
}
