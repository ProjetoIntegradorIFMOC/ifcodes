import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, CSSProperties } from "react";
import {
  ContentState,
  Editor,
  EditorState,
  Modifier,
  RichUtils,
  convertFromRaw,
  convertToRaw,
  DefaultDraftBlockRenderMap,
} from "draft-js";
import type { DraftHandleValue } from "draft-js";
import { Map } from "immutable";
import { Bold, Italic, Underline, List, ListOrdered, Undo, Redo } from "lucide-react";
import "draft-js/dist/Draft.css";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  onError?: (error: string | null) => void;
  error?: string;
};

type RichTextViewerProps = {
  value: string;
  className?: string;
};

type FontOption = {
  label: string;
  style: string | null;
  size?: number;
};

type FontFamilyOption = {
  label: string;
  style: string | null;
  family?: string;
};

type InlineControl = {
  label: string;
  style: string;
  icon: ComponentType<{ className?: string }>;
};

const FONT_SIZE_OPTIONS: FontOption[] = [
  { label: "Normal", style: null },
  { label: "10", style: "FONTSIZE_10", size: 10 },
  { label: "12", style: "FONTSIZE_12", size: 12 },
  { label: "14", style: "FONTSIZE_14", size: 14 },
  { label: "16", style: "FONTSIZE_16", size: 16 },
  { label: "18", style: "FONTSIZE_18", size: 18 },
  { label: "20", style: "FONTSIZE_20", size: 20 },
  { label: "22", style: "FONTSIZE_22", size: 22 },
  { label: "24", style: "FONTSIZE_24", size: 24 },
  { label: "28", style: "FONTSIZE_28", size: 28 },
  { label: "32", style: "FONTSIZE_32", size: 32 },
  { label: "36", style: "FONTSIZE_36", size: 36 },
];

const FONT_FAMILY_OPTIONS: FontFamilyOption[] = [
  { label: "Padrão", style: null },
  { label: "Arial", style: "FONTFAMILY_ARIAL", family: "Arial, sans-serif" },
  { label: "Times New Roman", style: "FONTFAMILY_TIMES", family: "'Times New Roman', serif" },
  { label: "Georgia", style: "FONTFAMILY_GEORGIA", family: "Georgia, serif" },
  { label: "Courier New", style: "FONTFAMILY_COURIER", family: "'Courier New', monospace" },
  { label: "Verdana", style: "FONTFAMILY_VERDANA", family: "Verdana, sans-serif" },
  { label: "Tahoma", style: "FONTFAMILY_TAHOMA", family: "Tahoma, sans-serif" },
  { label: "Trebuchet MS", style: "FONTFAMILY_TREBUCHET", family: "'Trebuchet MS', sans-serif" },
  { label: "Comic Sans MS", style: "FONTFAMILY_COMIC", family: "'Comic Sans MS', cursive" },
  { label: "Impact", style: "FONTFAMILY_IMPACT", family: "Impact, fantasy" },
];

const INLINE_CONTROLS: InlineControl[] = [
  { label: "Negrito", style: "BOLD", icon: Bold },
  { label: "Itálico", style: "ITALIC", icon: Italic },
  { label: "Sublinhado", style: "UNDERLINE", icon: Underline },
];

const customStyleMap: Record<string, CSSProperties> = {
  FONTSIZE_10: { fontSize: "10px" },
  FONTSIZE_12: { fontSize: "12px" },
  FONTSIZE_14: { fontSize: "14px" },
  FONTSIZE_16: { fontSize: "16px" },
  FONTSIZE_18: { fontSize: "18px" },
  FONTSIZE_20: { fontSize: "20px" },
  FONTSIZE_22: { fontSize: "22px" },
  FONTSIZE_24: { fontSize: "24px" },
  FONTSIZE_28: { fontSize: "28px" },
  FONTSIZE_32: { fontSize: "32px" },
  FONTSIZE_36: { fontSize: "36px" },
  FONTFAMILY_ARIAL: { fontFamily: "Arial, sans-serif" },
  FONTFAMILY_TIMES: { fontFamily: "'Times New Roman', serif" },
  FONTFAMILY_GEORGIA: { fontFamily: "Georgia, serif" },
  FONTFAMILY_COURIER: { fontFamily: "'Courier New', monospace" },
  FONTFAMILY_VERDANA: { fontFamily: "Verdana, sans-serif" },
  FONTFAMILY_TAHOMA: { fontFamily: "Tahoma, sans-serif" },
  FONTFAMILY_TREBUCHET: { fontFamily: "'Trebuchet MS', sans-serif" },
  FONTFAMILY_COMIC: { fontFamily: "'Comic Sans MS', cursive" },
  FONTFAMILY_IMPACT: { fontFamily: "Impact, fantasy" },
};

const blockRenderMap = DefaultDraftBlockRenderMap.merge(
  Map({
    "unordered-list-item": {
      element: "li",
    },
    "ordered-list-item": {
      element: "li",
    },
  })
);

const blockStyleFn = (block: any) => {
  const type = block.getType();
  if (type === "unordered-list-item") return "list-disc pl-6 my-1";
  if (type === "ordered-list-item") return "list-decimal pl-6 my-1";
  return "";
};

function createEditorStateFromValue(value: string) {
  if (!value) {
    return EditorState.createEmpty();
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && parsed.blocks && Array.isArray(parsed.blocks) && parsed.entityMap !== undefined) {
      return EditorState.createWithContent(convertFromRaw(parsed));
    }
  } catch (error) {
    const content = ContentState.createFromText(value);
    return EditorState.createWithContent(content);
  }

  return EditorState.createEmpty();
}

function serializeEditorState(editorState: EditorState) {
  const content = editorState.getCurrentContent();
  return JSON.stringify(convertToRaw(content));
}

function removeFontSizeStyles(editorState: EditorState) {
  const selection = editorState.getSelection();
  let content = editorState.getCurrentContent();

  FONT_SIZE_OPTIONS.forEach((option) => {
    if (option.style) {
      content = Modifier.removeInlineStyle(content, selection, option.style);
    }
  });

  const nextState = EditorState.push(editorState, content, "change-inline-style");
  return EditorState.forceSelection(nextState, selection);
}

function removeFontFamilyStyles(editorState: EditorState) {
  const selection = editorState.getSelection();
  let content = editorState.getCurrentContent();

  FONT_FAMILY_OPTIONS.forEach((option) => {
    if (option.style) {
      content = Modifier.removeInlineStyle(content, selection, option.style);
    }
  });

  const nextState = EditorState.push(editorState, content, "change-inline-style");
  return EditorState.forceSelection(nextState, selection);
}

function getCurrentFontSize(editorState: EditorState) {
  const inlineStyles = editorState.getCurrentInlineStyle();
  const match = FONT_SIZE_OPTIONS.find((option) => option.style && inlineStyles.has(option.style));
  return match?.style ?? null;
}

function getCurrentFontFamily(editorState: EditorState) {
  const inlineStyles = editorState.getCurrentInlineStyle();
  const match = FONT_FAMILY_OPTIONS.find((option) => option.style && inlineStyles.has(option.style));
  return match?.style ?? null;
}

function getCurrentBlockType(editorState: EditorState) {
  const selection = editorState.getSelection();
  const content = editorState.getCurrentContent();
  const block = content.getBlockForKey(selection.getStartKey());
  return block?.getType() ?? "unstyled";
}

export function getPlainTextFromRichValue(value: string) {
  const state = createEditorStateFromValue(value);
  return state.getCurrentContent().getPlainText();
}

export function RichTextEditor({ value, onChange, placeholder, className, maxLength, onError, error }: RichTextEditorProps) {
  const [editorState, setEditorState] = useState(() => createEditorStateFromValue(value));
  const editorRef = useRef<Editor | null>(null);
  const lastSerialized = useRef(value);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (value !== lastSerialized.current) {
      const nextState = createEditorStateFromValue(value);
      setEditorState(nextState);
      lastSerialized.current = value;
      const plainText = nextState.getCurrentContent().getPlainText();
      setCharCount(plainText.length);
    }
  }, [value]);

  const currentFontSize = useMemo(() => getCurrentFontSize(editorState), [editorState]);
  const currentFontFamily = useMemo(() => getCurrentFontFamily(editorState), [editorState]);
  const currentBlockType = useMemo(() => getCurrentBlockType(editorState), [editorState]);

  const handleBeforeInput = (): DraftHandleValue => {
    if (maxLength) {
      const plainText = editorState.getCurrentContent().getPlainText();
      const currentLength = plainText.length;
      
      if (currentLength >= maxLength) {
        if (onError) {
          onError(`O texto não pode ter mais de ${maxLength} caracteres. Atual: ${currentLength}`);
        }
        return 'handled';
      }
    }
    return 'not-handled';
  };

  const handlePastedText = (text: string): DraftHandleValue => {
    if (maxLength) {
      const plainText = editorState.getCurrentContent().getPlainText();
      const currentLength = plainText.length;
      const newLength = currentLength + text.length;
      
      if (newLength > maxLength) {
        if (onError) {
          onError(`O texto não pode ter mais de ${maxLength} caracteres. Atual: ${currentLength}`);
        }
        return 'handled';
      }
    }
    return 'not-handled';
  };

  const handleChange = (state: EditorState) => {
    const plainText = state.getCurrentContent().getPlainText();
    const currentLength = plainText.length;
    setCharCount(currentLength);

    if (maxLength && currentLength <= maxLength && onError) {
      onError(null);
    }

    setEditorState(state);
    const serialized = serializeEditorState(state);
    lastSerialized.current = serialized;
    onChange(serialized);
  };

  const handleKeyCommand = (command: string): DraftHandleValue => {
    if (command === "backspace") {
      const selection = editorState.getSelection();
      if (selection.isCollapsed()) {
        const content = editorState.getCurrentContent();
        const block = content.getBlockForKey(selection.getStartKey());
        if (block.getType() !== "unstyled" && block.getText().length === 0) {
          const newState = RichUtils.toggleBlockType(editorState, block.getType());
          handleChange(newState);
          return "handled";
        }
      }
    }

    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      handleChange(newState);
      return "handled";
    }

    return "not-handled";
  };

  const handleTab = (e: React.KeyboardEvent) => {
    const maxDepth = 4;
    handleChange(RichUtils.onTab(e, editorState, maxDepth));
  };

  const toggleInlineStyle = (style: string) => {
    handleChange(RichUtils.toggleInlineStyle(editorState, style));
  };

  const toggleBlockType = (type: string) => {
    handleChange(RichUtils.toggleBlockType(editorState, type));
  };

  const applyFontSize = (style: string | null) => {
    const selection = editorState.getSelection();
    
    if (!selection.getHasFocus()) {
      editorRef.current?.focus();
    }
    
    let nextState = removeFontSizeStyles(editorState);
    if (style) {
      nextState = RichUtils.toggleInlineStyle(nextState, style);
    }
    
    handleChange(nextState);
  };

  const applyFontFamily = (style: string | null) => {
    const selection = editorState.getSelection();
    
    if (!selection.getHasFocus()) {
      editorRef.current?.focus();
    }
    
    let nextState = removeFontFamilyStyles(editorState);
    if (style) {
      nextState = RichUtils.toggleInlineStyle(nextState, style);
    }
    
    handleChange(nextState);
  };

  const handleUndo = () => {
    handleChange(EditorState.undo(editorState));
  };

  const handleRedo = () => {
    handleChange(EditorState.redo(editorState));
  };

  const canUndo = editorState.getUndoStack().size > 0;
  const canRedo = editorState.getRedoStack().size > 0;

  return (
    <div className={cn("border rounded-lg", error ? "border-red-500" : "border-gray-300", className)}>
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
        <button
          type="button"
          onClick={handleUndo}
          disabled={!canUndo}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded border",
            !canUndo
              ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
          )}
          title="Desfazer (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleRedo}
          disabled={!canRedo}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded border",
            !canRedo
              ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
          )}
          title="Refazer (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </button>

        <div className="h-6 w-px bg-gray-300 mx-1" />

        <select
          className="h-9 rounded border border-gray-300 bg-white px-2 text-sm min-w-[140px]"
          value={currentFontFamily ?? ""}
          onChange={(event) => {
            applyFontFamily(event.target.value || null);
          }}
          title="Fonte"
        >
          {FONT_FAMILY_OPTIONS.map((option) => (
            <option key={option.label} value={option.style ?? ""} style={{ fontFamily: option.family }}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          className="h-9 rounded border border-gray-300 bg-white px-2 text-sm"
          value={currentFontSize ?? ""}
          onChange={(event) => {
            applyFontSize(event.target.value || null);
          }}
          title="Tamanho"
        >
          {FONT_SIZE_OPTIONS.map((option) => (
            <option key={option.label} value={option.style ?? ""}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="h-6 w-px bg-gray-300 mx-1" />

        {INLINE_CONTROLS.map((control) => {
          const Icon = control.icon;
          const isActive = editorState.getCurrentInlineStyle().has(control.style);
          return (
            <button
              key={control.style}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                toggleInlineStyle(control.style);
              }}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded border transition-colors",
                isActive ? "border-blue-500 bg-blue-100 text-blue-600" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              )}
              title={control.label}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}

        <div className="h-6 w-px bg-gray-300 mx-1" />

        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            toggleBlockType("unordered-list-item");
          }}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded border transition-colors",
            currentBlockType === "unordered-list-item"
              ? "border-blue-500 bg-blue-100 text-blue-600"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
          )}
          title="Lista não ordenada"
        >
          <List className="h-4 w-4" />
        </button>

        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            toggleBlockType("ordered-list-item");
          }}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded border transition-colors",
            currentBlockType === "ordered-list-item"
              ? "border-blue-500 bg-blue-100 text-blue-600"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
          )}
          title="Lista ordenada"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>

      <div
        className="min-h-[180px] px-3 py-2 cursor-text"
        onClick={() => {
          editorRef.current?.focus();
        }}
        style={{ userSelect: 'text', WebkitUserSelect: 'text' } as React.CSSProperties}
      >
        <Editor
          ref={editorRef}
          editorState={editorState}
          onChange={handleChange}
          handleKeyCommand={handleKeyCommand}
          handleBeforeInput={handleBeforeInput}
          handlePastedText={handlePastedText}
          onTab={handleTab}
          placeholder={placeholder}
          customStyleMap={customStyleMap}
          blockRenderMap={blockRenderMap}
          blockStyleFn={blockStyleFn}
          spellCheck={true}
        />
      </div>
      {maxLength && (
        <div className={cn(
          "border-t px-3 py-1 text-xs text-right",
          charCount > maxLength ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"
        )}>
          {charCount} / {maxLength} caracteres
        </div>
      )}
    </div>
  );
}

export function RichTextViewer({ value, className }: RichTextViewerProps) {
  const editorState = useMemo(() => createEditorStateFromValue(value), [value]);

  return (
    <div className={cn("prose max-w-none", className)}>
      <Editor
        editorState={editorState}
        readOnly
        onChange={() => undefined}
        customStyleMap={customStyleMap}
        blockRenderMap={blockRenderMap}
        blockStyleFn={blockStyleFn}
      />
    </div>
  );
}
