import {
  Code,
  Braces,
  Lock,
  Clock,
  Regex,
  CalendarClock,
  QrCode,
  Fingerprint,
  KeyRound,
  Hash,
  Shield,
  FileDiff,
  Type,
  Slash,
  Database,
  FileLock2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Tool {
  id: string;
  name: string;
  icon: LucideIcon;
  path: string;
}

// Fonte única da lista de ferramentas — consumida pela Sidebar e pela CommandPalette.
// Ordenada alfabeticamente por `name` (ordem de exibição; não afeta as rotas).
export const TOOLS: Tool[] = [
  { id: 'backslash', name: 'Backslash Escape', icon: Slash, path: '/backslash' },
  { id: 'base64', name: 'Base64 Formatter', icon: Code, path: '/base64' },
  { id: 'case', name: 'Case Converter', icon: Type, path: '/case' },
  { id: 'chmod', name: 'Chmod Calculator', icon: FileLock2, path: '/chmod' },
  { id: 'cron', name: 'Cron Parser', icon: CalendarClock, path: '/cron' },
  { id: 'sql', name: 'Formatador de SQL', icon: Database, path: '/sql' },
  { id: 'hash', name: 'Hash Generator', icon: Hash, path: '/hash' },
  { id: 'json-formatter', name: 'JSON Formatter', icon: Braces, path: '/' },
  { id: 'jwt', name: 'JWT Tool', icon: Lock, path: '/jwt' },
  { id: 'password', name: 'Password Generator', icon: KeyRound, path: '/password' },
  { id: 'qrcode', name: 'QR Code Generator', icon: QrCode, path: '/qrcode' },
  { id: 'regexp', name: 'RegExp Tester', icon: Regex, path: '/regexp' },
  { id: 'rsa', name: 'RSA Generator', icon: Shield, path: '/rsa' },
  { id: 'diff', name: 'Text Diff', icon: FileDiff, path: '/diff' },
  { id: 'unix-time', name: 'Unix Time', icon: Clock, path: '/unix-time' },
  { id: 'uuid', name: 'UUID Generator', icon: Fingerprint, path: '/uuid' },
];
