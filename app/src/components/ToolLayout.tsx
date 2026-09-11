import type { ReactNode } from 'react';

interface ToolLayoutProps {
  title: string;
  description: ReactNode;
  children: ReactNode;
}

/**
 * Shell padrão de uma ferramenta: `.main-content` + `.tool-header` (título/descrição).
 * O conteúdo (geralmente um ou mais `<div className="tool-body">`) fica a cargo de
 * cada tool — permite casos como o JwtDecoderTool, que tem uma barra de abas entre
 * o header e o body.
 */
export function ToolLayout({ title, description, children }: ToolLayoutProps) {
  return (
    <div className="main-content">
      <div className="tool-header">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
