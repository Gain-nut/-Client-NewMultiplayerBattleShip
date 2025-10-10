// src/socket.js
import { io } from 'socket.io-client';

// URL ของ Server ที่เรารันไว้
// !!สำคัญ: ถ้าทดสอบบนเครื่องเดียวกันใช้ 'http://localhost:3001'
// แต่ตอนจะเล่น 2 เครื่อง ให้เปลี่ยนเป็น IP ของเครื่องที่รัน Server
// เช่น 'http://192.168.1.100:3001'
const SERVER_URL = 'http://localhost:3001';
// const SERVER_URL = 'http://172.20.10.2:3001';


export const socket = io(SERVER_URL);