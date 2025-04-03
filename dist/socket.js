"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const http_1 = __importDefault(require("http"));
const sdk_1 = require("@deepgram/sdk");
const app = (0, express_1.default)();
app.use(express_1.default.static('public'));
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
wss.on('connection', (socket) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Client connected');
    const deepgram = (0, sdk_1.createClient)(process.env.DEEPGRAM_API_KEY);
    const live = deepgram.listen.live({
        model: 'nova',
        language: 'es',
        smart_format: true,
        interim_results: false,
    });
    // Event: Deepgram connection open
    live.on(sdk_1.LiveTranscriptionEvents.Open, () => {
        console.log('Deepgram connection open');
    });
    // Event: Transcript received
    live.on(sdk_1.LiveTranscriptionEvents.Transcript, (data) => {
        var _a;
        const transcript = (_a = data.channel.alternatives[0]) === null || _a === void 0 ? void 0 : _a.transcript;
        if (transcript) {
            process.env.NODE_ENV !== 'production' && console.log("transcribed: ", transcript);
            socket.send(transcript);
        }
    });
    // Forward audio data from client to Deepgram
    socket.on('message', (audioChunk) => {
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
}));
server.listen(3000, () => {
    console.log("online");
});
