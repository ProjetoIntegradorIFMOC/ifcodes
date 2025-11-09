"use client";

import { useState, useRef } from "react";
import {
  Code2,
  CheckCircle2,
  Loader2,
  Zap,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Editor from "@monaco-editor/react";
import { postSubmission } from "@/services/SubmissionsService";
import type { Activity } from "@/types";

/**
 * Componente de submissão de código com integração ao Monaco Editor.
 * Permite edição de código C, visualização em tela cheia e submissão.
 */
interface CodeSubmissionProps {
  onSubmit: (code: string) => void;
}

export function CodeSubmissionComponent({ onSubmit }: CodeSubmissionProps) {
  // Estado para alternar entre modo normal e tela cheia
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Estado que armazena o código digitado pelo usuário
  const [codeValue, setCodeValue] = useState(
    "#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}"
  );

  // Estado para arquivo de submissão (suporte a upload futuro)
  const [submissionCodeFile, setSubmissionCodeFile] = useState(null);

  // Estado para texto extraído do arquivo de submissão (suporte futuro)
  const [submissionCodeText, setSubmissionCodeText] = useState("");

  // Estado de carregamento no envio
  const [submitting, setSubmitting] = useState(false);

  // Referência para o editor Monaco, possibilitando comandos diretos
  const editorRef = useRef(null);

  /**
   * Alterna entre o modo tela cheia e normal.
   */
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  /**
   * Função chamada ao montar o editor Monaco.
   * Permite configurar atalhos e opções extras do editor.
   */
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configurações visuais e funcionais do editor
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: "on",
      lineNumbers: "on",
      renderWhitespace: "selection",
      bracketPairColorization: { enabled: true },
    });

    // Atalho de teclado para tela cheia (F11)
    editor.addCommand(monaco.KeyCode.F11, () => {
      toggleFullscreen();
    });
  };

  /**
   * Atualiza o estado do código conforme o usuário digita.
   */
  const handleEditorChange = (value) => {
    setCodeValue(value || "");
  };

  /**
   * Função chamada ao enviar a submissão.
   * Adicione aqui a lógica real de envio para o backend.
   */
  const handleSubmit = async () => {
    onSubmit(codeValue);
  };

  // ----- Renderização do modo tela cheia (fullscreen) -----
  if (isFullscreen) {
    return (
      // Overlay cobrindo toda a tela
      <div className="fixed inset-0 z-50 bg-white">
        <div className="h-full flex flex-col">
          {/* Cabeçalho do modo tela cheia */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Code2 className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Editor de Código C - Modo Tela Cheia
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {/* Botão para sair do modo tela cheia */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="flex items-center gap-2"
              >
                <Minimize2 className="w-4 h-4" />
                Sair da Tela Cheia (F11)
              </Button>
              {/* Botão de fechar */}
              <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Editor Monaco ocupando o máximo da área visível */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="c"
              value={codeValue}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              theme="vs-light"
              options={{
                fontSize: 16,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                insertSpaces: true,
                wordWrap: "on",
                lineNumbers: "on",
                renderWhitespace: "all",
                bracketPairColorization: { enabled: true },
                folding: true,
                foldingHighlight: true,
                showFoldingControls: "always",
              }}
            />
          </div>

          {/* Rodapé do modo tela cheia: estatísticas e ações */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              {/* Exibe estatísticas do código */}
              <div className="text-sm text-gray-600 flex items-center gap-4">
                <span>Linhas: {codeValue.split("\n").length}</span>
                <span>Caracteres: {codeValue.length}</span>
                <span>Linguagem: C</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Botão para limpar o código */}
                <Button
                  variant="outline"
                  onClick={() => setCodeValue("")}
                  size="sm"
                >
                  Limpar
                </Button>
                {/* Botão de submissão */}
                <Button
                  onClick={handleSubmit}
                  // disabled={submitting || !codeValue.trim()}
                  className="flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Enviar Submissão
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----- Renderização do modo normal (não tela cheia) -----
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          {/* Cabeçalho: label e botão de tela cheia */}
          <div className="flex items-center justify-between">
            <Label
              htmlFor="code"
              className="text-sm font-medium flex items-center gap-2"
            >
              <Code2 className="w-4 h-4" />
              Código em C:
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="flex items-center gap-2"
            >
              <Maximize2 className="w-4 h-4" />
              Tela Cheia (F11)
            </Button>
          </div>

          {/* Editor Monaco em tamanho reduzido */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Editor
              height="300px"
              defaultLanguage="c"
              value={codeValue}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              theme="vs-light"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                insertSpaces: true,
                wordWrap: "on",
                lineNumbers: "on",
                renderWhitespace: "selection",
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>
        </div>

        {/* Área para exibição de arquivo selecionado e prévia do código (upload futuro) */}
        {submissionCodeFile && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Arquivo selecionado: {submissionCodeFile.name}
              </span>
              <span className="text-xs text-green-600 ml-auto">
                {(submissionCodeFile.size / 1024).toFixed(1)} KB
              </span>
            </div>

            {submissionCodeText && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Prévia do código:</Label>
                <CodePreview
                  code={submissionCodeText}
                  filename={submissionCodeFile.name}
                />
              </div>
            )}
          </div>
        )}

        {/* Botões de ação: limpar e enviar */}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCodeValue("")} size="sm">
            Limpar Código
          </Button>

          <Button
            onClick={handleSubmit}
            // disabled={submitting || !codeValue.trim()}
            className="flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Enviar Submissão
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente de visualização de código (read-only)
 * Similar ao CodeSubmissionComponent mas sem possibilidade de edição
 */
interface CodeViewerProps {
  code: string;
  language?: string;
}

export function CodeViewer({ code, language = "c" }: CodeViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Modo tela cheia
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Code2 className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Visualização do Código - Modo Tela Cheia
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="flex items-center gap-2"
              >
                <Minimize2 className="w-4 h-4" />
                Sair da Tela Cheia
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage={language}
              value={code}
              theme="vs-light"
              options={{
                readOnly: true,
                fontSize: 16,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: "on",
                lineNumbers: "on",
                renderWhitespace: "all",
                bracketPairColorization: { enabled: true },
                folding: true,
                foldingHighlight: true,
                showFoldingControls: "always",
              }}
            />
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 flex items-center gap-4">
                <span>Linhas: {code.split("\n").length}</span>
                <span>Caracteres: {code.length}</span>
                <span>Linguagem: {language.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modo normal
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="code-viewer"
              className="text-sm font-medium flex items-center gap-2"
            >
              <Code2 className="w-4 h-4" />
              Código Submetido:
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="flex items-center gap-2"
            >
              <Maximize2 className="w-4 h-4" />
              Tela Cheia
            </Button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Editor
              height="300px"
              defaultLanguage={language}
              value={code}
              theme="vs-light"
              options={{
                readOnly: true,
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: "on",
                lineNumbers: "on",
                renderWhitespace: "selection",
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
