import React, { useRef, useEffect, useCallback } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Link, Eraser, Undo, Redo
} from 'lucide-react';

function ToolbarBtn({ title, onMouseDown, icon: Icon, active }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={onMouseDown}
      className={`p-1.5 rounded text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors ${active ? 'bg-slate-200 text-slate-900' : ''}`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

export default function RichTextEditor({ value, onChange, placeholder = 'Type here...' }) {
  const editorRef = useRef(null);
  const isInternalChange = useRef(false);

  // Sync value into DOM only when it changes from outside
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const exec = useCallback((cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    handleInput();
  }, []);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    isInternalChange.current = true;
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const handleLink = useCallback(() => {
    const url = prompt('Enter URL:', 'https://');
    if (url) exec('createLink', url);
  }, [exec]);

  const toolbarButtons = [
    { title: 'Undo', icon: Undo, action: () => exec('undo') },
    { title: 'Redo', icon: Redo, action: () => exec('redo') },
    null, // separator
    { title: 'Bold', icon: Bold, action: () => exec('bold') },
    { title: 'Italic', icon: Italic, action: () => exec('italic') },
    { title: 'Underline', icon: Underline, action: () => exec('underline') },
    { title: 'Strikethrough', icon: Strikethrough, action: () => exec('strikeThrough') },
    null,
    { title: 'Bullet List', icon: List, action: () => exec('insertUnorderedList') },
    { title: 'Numbered List', icon: ListOrdered, action: () => exec('insertOrderedList') },
    null,
    { title: 'Insert Link', icon: Link, action: handleLink },
    { title: 'Clear Formatting', icon: Eraser, action: () => exec('removeFormat') },
  ];

  return (
    <div className="border border-slate-300 rounded-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-slate-50 border-b border-slate-200">
        {toolbarButtons.map((btn, i) =>
          btn === null
            ? <div key={i} className="w-px h-5 bg-slate-200 mx-1" />
            : <ToolbarBtn
                key={btn.title}
                title={btn.title}
                icon={btn.icon}
                onMouseDown={(e) => { e.preventDefault(); btn.action(); }}
              />
        )}
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="min-h-[200px] p-3 text-sm text-slate-800 focus:outline-none prose prose-sm max-w-none"
        style={{ lineHeight: 1.6 }}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
        [contenteditable] ul { list-style: disc; padding-left: 1.25rem; }
        [contenteditable] ol { list-style: decimal; padding-left: 1.25rem; }
        [contenteditable] h1 { font-size: 1.25rem; font-weight: 700; margin: 0.5rem 0; }
        [contenteditable] h2 { font-size: 1.1rem; font-weight: 700; margin: 0.5rem 0; }
        [contenteditable] h3 { font-size: 1rem; font-weight: 700; margin: 0.5rem 0; }
        [contenteditable] a  { color: #2563eb; text-decoration: underline; }
        [contenteditable] strong { font-weight: 700; }
      `}</style>
    </div>
  );
}
