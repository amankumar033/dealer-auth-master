'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiAlignJustify,
  FiLink,
  FiImage,
  FiPlus,
  FiMinus,
  FiChevronDown
} from 'react-icons/fi';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter content...',
  height = '200px',
  className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isEditing, setIsEditing] = useState(true);

  const commonColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#008000', '#FFC0CB', '#A52A2A', '#808080', '#FFD700'
  ];

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.innerHTML = value;
    }
    // Ensure textarea has the current value
    if (textareaRef.current && isEditing) {
      textareaRef.current.value = value;
    }
  }, [value, isEditing]);

  // Close color pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.color-picker-container') && !target.closest('.color-dropdown-container')) {
        setShowColorPicker(false);
        setShowColorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return { start: 0, end: 0, text: '' };
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value.substring(start, end);
    
    return { start, end, text };
  };

  const replaceSelection = (replacement: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const { start, end } = getSelection();
    const newValue = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    
    textarea.value = newValue;
    onChange(newValue);
    
    // Set cursor position after replacement
    const newCursorPos = start + replacement.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    textarea.focus();
  };

  const wrapSelection = (before: string, after: string) => {
    const { start, end, text } = getSelection();
    if (text) {
      const replacement = before + text + after;
      replaceSelection(replacement);
    }
  };

  const toggleBold = () => {
    wrapSelection('<strong>', '</strong>');
    setIsBold(!isBold);
  };

  const toggleItalic = () => {
    wrapSelection('<em>', '</em>');
    setIsItalic(!isItalic);
  };

  const toggleUnderline = () => {
    wrapSelection('<u>', '</u>');
    setIsUnderline(!isUnderline);
  };

  const insertUnorderedList = () => {
    const { text } = getSelection();
    if (text) {
      const lines = text.split('\n');
      const listItems = lines.map(line => `<li>${line}</li>`).join('');
      replaceSelection(`<ul>${listItems}</ul>`);
    } else {
      replaceSelection('<ul><li>List item</li></ul>');
    }
  };

  const insertOrderedList = () => {
    const { text } = getSelection();
    if (text) {
      const lines = text.split('\n');
      const listItems = lines.map(line => `<li>${line}</li>`).join('');
      replaceSelection(`<ol>${listItems}</ol>`);
    } else {
      replaceSelection('<ol><li>List item</li></ol>');
    }
  };

  const setTextAlignment = (align: 'left' | 'center' | 'right' | 'justify') => {
    const { text } = getSelection();
    if (text) {
      const style = `text-align: ${align};`;
      replaceSelection(`<div style="${style}">${text}</div>`);
    }
    setAlignment(align);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      const { text } = getSelection();
      const linkText = text || 'Link';
      replaceSelection(`<a href="${url}" target="_blank">${linkText}</a>`);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      replaceSelection(`<img src="${url}" alt="Image" style="max-width: 100%; height: auto;" />`);
    }
  };

  const clearFormatting = () => {
    const { text } = getSelection();
    if (text) {
      // Remove HTML tags
      const plainText = text.replace(/<[^>]*>/g, '');
      replaceSelection(plainText);
    }
  };

  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 2, 72);
    setFontSize(newSize);
    const { text } = getSelection();
    if (text) {
      replaceSelection(`<span style="font-size: ${newSize}px; color: ${selectedColor};">${text}</span>`);
    }
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 2, 8);
    setFontSize(newSize);
    const { text } = getSelection();
    if (text) {
      replaceSelection(`<span style="font-size: ${newSize}px; color: ${selectedColor};">${text}</span>`);
    }
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    const { text } = getSelection();
    if (text) {
      replaceSelection(`<span style="color: ${color};">${text}</span>`);
    }
    setShowColorPicker(false);
    setShowColorDropdown(false);
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setSelectedColor(color);
    const { text } = getSelection();
    if (text) {
      replaceSelection(`<span style="color: ${color};">${text}</span>`);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
        textarea.value = newValue;
        onChange(newValue);
        textarea.setSelectionRange(start + 4, start + 4);
      }
    }
  };

  // Focus textarea when switching to edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* Toolbar */}
      <div className="toolbar bg-gray-50 border border-gray-300 border-b-0 rounded-t-md p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <button
          type="button"
          onClick={toggleBold}
          className={`p-2 rounded hover:bg-gray-200 ${isBold ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
          title="Bold"
        >
          <FiBold size={16} />
        </button>

        <button
          type="button"
          onClick={toggleItalic}
          className={`p-2 rounded hover:bg-gray-200 ${isItalic ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
          title="Italic"
        >
          <FiItalic size={16} />
        </button>

        <button
          type="button"
          onClick={toggleUnderline}
          className={`p-2 rounded hover:bg-gray-200 ${isUnderline ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
          title="Underline"
        >
          <FiUnderline size={16} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Font Size Controls */}
        <button
          type="button"
          onClick={decreaseFontSize}
          className="p-2 rounded hover:bg-gray-200 text-gray-700"
          title="Decrease Font Size"
        >
          <FiMinus size={16} />
        </button>

        <span className="px-2 py-2 text-sm text-gray-700 font-medium">
          {fontSize}px
        </span>

        <button
          type="button"
          onClick={increaseFontSize}
          className="p-2 rounded hover:bg-gray-200 text-gray-700"
          title="Increase Font Size"
        >
          <FiPlus size={16} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Color Controls */}
        <div className="relative color-dropdown-container">
          <button
            type="button"
            onClick={() => setShowColorDropdown(!showColorDropdown)}
            className="p-2 rounded hover:bg-gray-200 text-gray-700 flex items-center gap-1"
            title="Color Dropdown"
          >
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: selectedColor }}
            ></div>
            <FiChevronDown size={12} />
          </button>

          {showColorDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 p-2">
              <div className="grid grid-cols-5 gap-1">
                {commonColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorChange(color)}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative color-picker-container">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 rounded hover:bg-gray-200 text-gray-700"
            title="Color Picker"
          >
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: selectedColor }}
            ></div>
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 p-2">
              <input
                type="color"
                value={selectedColor}
                onChange={handleColorPickerChange}
                className="w-32 h-8 cursor-pointer"
              />
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* List Controls */}
        <button
          type="button"
          onClick={insertUnorderedList}
          className="p-2 rounded hover:bg-gray-200 text-gray-700"
          title="Bullet List"
        >
          <FiList size={16} />
        </button>

        <button
          type="button"
          onClick={insertOrderedList}
          className="p-2 rounded hover:bg-gray-200 text-gray-700 text-sm font-bold"
          title="Numbered List"
        >
          1.
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Alignment Controls */}
        <button
          type="button"
          onClick={() => setTextAlignment('left')}
          className={`p-2 rounded hover:bg-gray-200 ${alignment === 'left' ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
          title="Align Left"
        >
          <FiAlignLeft size={16} />
        </button>

        <button
          type="button"
          onClick={() => setTextAlignment('center')}
          className={`p-2 rounded hover:bg-gray-200 ${alignment === 'center' ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
          title="Align Center"
        >
          <FiAlignCenter size={16} />
        </button>

        <button
          type="button"
          onClick={() => setTextAlignment('right')}
          className={`p-2 rounded hover:bg-gray-200 ${alignment === 'right' ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
          title="Align Right"
        >
          <FiAlignRight size={16} />
        </button>

        <button
          type="button"
          onClick={() => setTextAlignment('justify')}
          className={`p-2 rounded hover:bg-gray-200 ${alignment === 'justify' ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
          title="Justify"
        >
          <FiAlignJustify size={16} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Link and Image */}
        <button
          type="button"
          onClick={insertLink}
          className="p-2 rounded hover:bg-gray-200 text-gray-700"
          title="Insert Link"
        >
          <FiLink size={16} />
        </button>

        <button
          type="button"
          onClick={insertImage}
          className="p-2 rounded hover:bg-gray-200 text-gray-700"
          title="Insert Image"
        >
          <FiImage size={16} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        <button
          type="button"
          onClick={clearFormatting}
          className="p-2 rounded hover:bg-gray-200 text-gray-700 text-xs font-medium"
          title="Clear Formatting"
        >
          Clear
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 rounded hover:bg-gray-200 text-gray-700 text-xs font-medium"
          title={isEditing ? "Preview" : "Edit HTML"}
        >
          {isEditing ? "Preview" : "Edit HTML"}
        </button>
      </div>

             {/* Editor */}
       {isEditing ? (
         <textarea
           ref={textareaRef}
           value={value}
           onChange={handleTextareaChange}
           onKeyDown={handleTextareaKeyDown}
           className="w-full border border-gray-300 rounded-b-md p-3 min-h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
           style={{
             height,
             direction: 'ltr',
             textAlign: 'left',
             resize: 'vertical',
             width: '100%',
             boxSizing: 'border-box'
           }}
           placeholder={placeholder}
           dir="ltr"
           lang="en"
         />
       ) : (
         <div
           ref={previewRef}
           className="w-full border border-gray-300 rounded-b-md p-3 min-h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
           style={{
             height,
             direction: 'ltr',
             textAlign: 'left',
             overflowY: 'auto',
             width: '100%',
             boxSizing: 'border-box'
           }}
           dir="ltr"
           lang="en"
         />
       )}

             <style jsx>{`
         .rich-text-editor {
           width: 100%;
         }
         
         .rich-text-editor textarea {
           font-family: 'Courier New', monospace;
           line-height: 1.5;
           color: #374151;
           direction: ltr !important;
           text-align: left !important;
           unicode-bidi: normal !important;
           width: 100% !important;
           box-sizing: border-box !important;
         }

                 .rich-text-editor div[ref="previewRef"] {
           font-size: 14px;
           line-height: 1.5;
           color: #374151;
           direction: ltr !important;
           text-align: left !important;
           unicode-bidi: normal !important;
           width: 100% !important;
           box-sizing: border-box !important;
         }

        .rich-text-editor div[ref="previewRef"] p {
          margin: 0 0 0.5rem 0;
          direction: ltr !important;
          text-align: left !important;
        }

        .rich-text-editor div[ref="previewRef"] ul, 
        .rich-text-editor div[ref="previewRef"] ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
          direction: ltr !important;
          text-align: left !important;
        }

        .rich-text-editor div[ref="previewRef"] li {
          direction: ltr !important;
          text-align: left !important;
        }

        .rich-text-editor div[ref="previewRef"] a {
          color: #3b82f6;
          text-decoration: underline;
          direction: ltr !important;
        }

        .rich-text-editor div[ref="previewRef"] img {
          max-width: 100%;
          height: auto;
        }

        .rich-text-editor div[ref="previewRef"] div {
          direction: ltr !important;
          text-align: left !important;
        }

        .rich-text-editor div[ref="previewRef"] span {
          direction: ltr !important;
          text-align: left !important;
        }

        .rich-text-editor div[ref="previewRef"] * {
          direction: ltr !important;
          text-align: left !important;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor; 