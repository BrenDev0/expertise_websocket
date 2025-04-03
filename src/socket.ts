import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

const app = express();
app.use(express.static('public'));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });


wss.on('connection', async (socket: WebSocket) => {
  console.log('Client connected');

  const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

  const live = deepgram.listen.live({
    model: 'nova',
    language: 'es',
    smart_format: true,
    interim_results: false,
  });

  // Event: Deepgram connection open
  live.on(LiveTranscriptionEvents.Open, () => {
    console.log('Deepgram connection open');
  });

  // Event: Transcript received
  live.on(LiveTranscriptionEvents.Transcript, (data) => {
    const transcript = data.channel.alternatives[0]?.transcript;
    if (transcript) {
      socket.send(transcript);
    }
  });

  // Forward audio data from client to Deepgram
  socket.on('message', (audioChunk: Buffer) => {
    if (live.getReadyState() === 1) {
      live.send(audioChunk);
    }
  });

  socket.on('close', () => {
    console.log('Client disconnected');
    live.requestClose();
  });

  socket.on('error', (err) => {
    console.error('WebSocket error:', err);
    live.requestClose();
  });
});

server.listen(3000, () => {
  console.log("online");
});
