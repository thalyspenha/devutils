import { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
import { ErrorBoundary } from './components/ErrorBoundary';

const JsonFormatterTool = lazy(() => import('./components/JsonFormatterTool').then((m) => ({ default: m.JsonFormatterTool })));
const Base64Tool = lazy(() => import('./components/Base64Tool').then((m) => ({ default: m.Base64Tool })));
const JwtDecoderTool = lazy(() => import('./components/JwtDecoderTool').then((m) => ({ default: m.JwtDecoderTool })));
const UnixTimeConverterTool = lazy(() => import('./components/UnixTimeConverterTool').then((m) => ({ default: m.UnixTimeConverterTool })));
const RegExpTesterTool = lazy(() => import('./components/RegExpTesterTool').then((m) => ({ default: m.RegExpTesterTool })));
const CronParserTool = lazy(() => import('./components/CronParserTool').then((m) => ({ default: m.CronParserTool })));
const QrCodeGeneratorTool = lazy(() => import('./components/QrCodeGeneratorTool').then((m) => ({ default: m.QrCodeGeneratorTool })));
const UuidGeneratorTool = lazy(() => import('./components/UuidGeneratorTool').then((m) => ({ default: m.UuidGeneratorTool })));
const PasswordGeneratorTool = lazy(() => import('./components/PasswordGeneratorTool').then((m) => ({ default: m.PasswordGeneratorTool })));
const HashGeneratorTool = lazy(() => import('./components/HashGeneratorTool').then((m) => ({ default: m.HashGeneratorTool })));
const RsaGeneratorTool = lazy(() => import('./components/RsaGeneratorTool').then((m) => ({ default: m.RsaGeneratorTool })));
const TextDiffTool = lazy(() => import('./components/TextDiffTool').then((m) => ({ default: m.TextDiffTool })));
const CaseConverterTool = lazy(() => import('./components/CaseConverterTool').then((m) => ({ default: m.CaseConverterTool })));
const BackslashEscapeTool = lazy(() => import('./components/BackslashEscapeTool').then((m) => ({ default: m.BackslashEscapeTool })));
const SqlFormatterTool = lazy(() => import('./components/SqlFormatterTool').then((m) => ({ default: m.SqlFormatterTool })));
const ChmodCalculatorTool = lazy(() => import('./components/ChmodCalculatorTool').then((m) => ({ default: m.ChmodCalculatorTool })));
const UrlParserTool = lazy(() => import('./components/UrlParserTool').then((m) => ({ default: m.UrlParserTool })));

function RouteFallback() {
  return (
    <div
      className="flex items-center justify-center flex-1"
      style={{ color: 'var(--text-secondary)', fontSize: '14px' }}
    >
      Carregando...
    </div>
  );
}

function ToolRoutes() {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.pathname}>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<JsonFormatterTool />} />
          <Route path="/base64" element={<Base64Tool />} />
          <Route path="/jwt" element={<JwtDecoderTool />} />
          <Route path="/unix-time" element={<UnixTimeConverterTool />} />
          <Route path="/regexp" element={<RegExpTesterTool />} />
          <Route path="/cron" element={<CronParserTool />} />
          <Route path="/qrcode" element={<QrCodeGeneratorTool />} />
          <Route path="/uuid" element={<UuidGeneratorTool />} />
          <Route path="/password" element={<PasswordGeneratorTool />} />
          <Route path="/hash" element={<HashGeneratorTool />} />
          <Route path="/rsa" element={<RsaGeneratorTool />} />
          <Route path="/diff" element={<TextDiffTool />} />
          <Route path="/case" element={<CaseConverterTool />} />
          <Route path="/backslash" element={<BackslashEscapeTool />} />
          <Route path="/sql" element={<SqlFormatterTool />} />
          <Route path="/chmod" element={<ChmodCalculatorTool />} />
          <Route path="/url" element={<UrlParserTool />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <HashRouter>
      <Sidebar />
      <CommandPalette />
      <ToolRoutes />
    </HashRouter>
  );
}

export default App;
