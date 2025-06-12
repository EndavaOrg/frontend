import 'whatwg-fetch';
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder as any;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as any;
}

process.env.VITE_BACKEND_API_URL = 'http://localhost:5000';
