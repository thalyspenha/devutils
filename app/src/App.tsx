import { HashRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { JsonFormatterTool } from './components/JsonFormatterTool';
import { Base64Tool } from './components/Base64Tool';
import { JwtDecoderTool } from './components/JwtDecoderTool';
import { UnixTimeConverterTool } from './components/UnixTimeConverterTool';
import { RegExpTesterTool } from './components/RegExpTesterTool';
import { CronParserTool } from './components/CronParserTool';
import { QrCodeGeneratorTool } from './components/QrCodeGeneratorTool';
import { UuidGeneratorTool } from './components/UuidGeneratorTool';
import { PasswordGeneratorTool } from './components/PasswordGeneratorTool';
import { HashGeneratorTool } from './components/HashGeneratorTool';
import { RsaGeneratorTool } from './components/RsaGeneratorTool';
import { TextDiffTool } from './components/TextDiffTool';
import { CaseConverterTool } from './components/CaseConverterTool';
import { BackslashEscapeTool } from './components/BackslashEscapeTool';
function App() {
  return (
    <HashRouter>
      <Sidebar />
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
      </Routes>
    </HashRouter>
  );
}

export default App;
