import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, HelpCircle, ArrowUp, RefreshCw, BookOpen } from 'lucide-react';
import { LevelType } from '../types';

interface EducationRendererProps {
  text: string;
  levelColor: 'emerald' | 'amber' | 'rose';
  onQuickAction?: (actionPrompt: string) => void;
  onUpgradeLevel?: () => void;
  currentLevel: LevelType;
}

export default function EducationRenderer({
  text,
  levelColor,
  onQuickAction,
  onUpgradeLevel,
  currentLevel,
}: EducationRendererProps) {
  // Extract level tags
  let cleanedText = text.trim();
  let detectedTag = '';

  const tagRegex = /^\[(🟢 BIENNIO|🟡 TRIENNIO|🔴 MATURITÀ)\]/i;
  const match = cleanedText.match(tagRegex);
  if (match) {
    detectedTag = match[0];
    cleanedText = cleanedText.replace(tagRegex, '').trim();
  }

  // Detect and isolate the closing tutor question matching "— Vuoi salire di livello?..." or starting with "— " (em-dash)
  let tutorQuestion = '';
  const questionIndex = cleanedText.lastIndexOf('—');
  if (questionIndex !== -1 && cleanedText.length - questionIndex < 200) {
    tutorQuestion = cleanedText.substring(questionIndex).trim();
    cleanedText = cleanedText.substring(0, questionIndex).trim();
  }

  // Helper to parse formatting (bold **, italics *) into HTML-like virtual DOM
  const parseInlineStyles = (lineText: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3/g;
    let lastIndex = 0;
    let matchParts;

    while ((matchParts = regex.exec(lineText)) !== null) {
      const matchIndex = matchParts.index;
      // Plain text preceding the style mark
      if (matchIndex > lastIndex) {
        parts.push(lineText.substring(lastIndex, matchIndex));
      }

      if (matchParts[1]) {
        // Bold
        parts.push(
          <strong key={matchIndex} className="font-semibold text-slate-900">
            {matchParts[2]}
          </strong>
        );
      } else if (matchParts[3]) {
        // Italics
        parts.push(
          <em key={matchIndex} className="italic text-slate-800">
            {matchParts[4]}
          </em>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < lineText.length) {
      parts.push(lineText.substring(lastIndex));
    }

    return parts.length > 0 ? parts : lineText;
  };

  // Convert text blocks to rich HTML elements
  const renderContentBlocks = () => {
    const lines = cleanedText.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let inList = false;

    const flushList = (keyPrefix: number) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${keyPrefix}`} className="space-y-2 my-3 pl-1">
            {listItems.map((item, id) => (
              <li key={id} className="flex items-start text-sm leading-relaxed text-slate-700">
                <span className={`inline-flex items-center justify-center mr-2.5 mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                  levelColor === 'emerald' ? 'bg-emerald-500' : levelColor === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
                }`} />
                <span>{parseInlineStyles(item)}</span>
              </li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Header h1, h2, h3
      if (trimmedLine.startsWith('### ')) {
        flushList(index);
        elements.push(
          <h4 key={index} className="font-display font-semibold text-base text-slate-800 mt-4 mb-2">
            {parseInlineStyles(trimmedLine.replace(/^### /, ''))}
          </h4>
        );
      } else if (trimmedLine.startsWith('## ')) {
        flushList(index);
        elements.push(
          <h3 key={index} className="font-display font-extrabold text-lg text-slate-900 mt-5 mb-2.5 border-b border-dashed border-slate-100 pb-1">
            {parseInlineStyles(trimmedLine.replace(/^## /, ''))}
          </h3>
        );
      } else if (trimmedLine.startsWith('# ')) {
        flushList(index);
        elements.push(
          <h2 key={index} className="font-display font-black text-xl text-slate-950 mt-6 mb-3">
            {parseInlineStyles(trimmedLine.replace(/^# /, ''))}
          </h2>
        );
      }
      // Blockquotes
      else if (trimmedLine.startsWith('> ')) {
        flushList(index);
        elements.push(
          <blockquote key={index} className={`border-l-4 pl-4 py-1.5 my-3 italic text-slate-600 bg-slate-50/50 rounded-r-md text-sm ${
            levelColor === 'emerald' ? 'border-emerald-500' : levelColor === 'amber' ? 'border-amber-500' : 'border-rose-500'
          }`}>
            {parseInlineStyles(trimmedLine.replace(/^> /, ''))}
          </blockquote>
        );
      }
      // Bullet list items
      else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('• ')) {
        inList = true;
        listItems.push(trimmedLine.replace(/^[-*•]\s+/, ''));
      }
      // Empty spaces
      else if (trimmedLine === '') {
        flushList(index);
      }
      // Standard Paragraph
      else {
        flushList(index);
        elements.push(
          <p key={index} className="text-sm leading-relaxed text-slate-700 my-2.5">
            {parseInlineStyles(trimmedLine)}
          </p>
        );
      }
    });

    flushList(lines.length);
    return elements;
  };

  // Setup thematic borders/colors for active block based on tutor level
  const borderTheme = {
    emerald: 'border-emerald-100 bg-emerald-50/20 text-emerald-800',
    amber: 'border-amber-100 bg-amber-50/20 text-amber-800',
    rose: 'border-rose-100 bg-rose-50/20 text-rose-800',
  }[levelColor];

  const pillTheme = {
    emerald: 'hover:bg-emerald-50 hover:text-emerald-700 bg-emerald-50/40 text-emerald-800 border-emerald-100',
    amber: 'hover:bg-amber-50 hover:text-amber-700 bg-amber-50/40 text-amber-800 border-amber-100',
    rose: 'hover:bg-rose-50 hover:text-rose-700 bg-rose-50/40 text-rose-800 border-rose-100',
  }[levelColor];

  return (
    <div className="space-y-4">
      {/* Level Banner Node */}
      {detectedTag && (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider level-card-transition border ${borderTheme}`}>
          <Sparkles className="h-3 w-3" />
          <span>{detectedTag.replace(/[\[\]]/g, '')}</span>
        </div>
      )}

      {/* Main explanation content body */}
      <div className="prose max-w-none text-slate-800">
        {renderContentBlocks()}
      </div>

      {/* Tutor Question Callout Card and Student Prompts */}
      {(tutorQuestion || onQuickAction) && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-6 pt-4 border-t border-slate-100`}
        >
          {tutorQuestion && (
            <p className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-3">
              <HelpCircle className={`h-4 w-4 ${
                levelColor === 'emerald' ? 'text-emerald-500' : levelColor === 'amber' ? 'text-amber-500' : 'text-rose-500'
              }`} />
              <span>{tutorQuestion.replace(/^—\s*/, '')}</span>
            </p>
          )}

          {/* Quick-reply chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {onQuickAction && (
              <>
                <button
                  id="btn-quick-example"
                  onClick={() => onQuickAction("Puoi farmi un esempio pratico di questo concetto?")}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition duration-200 flex items-center gap-1 cursor-pointer select-none ${pillTheme}`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>💡 Fammi un esempio</span>
                </button>
                <button
                  id="btn-quick-doubt"
                  onClick={() => onQuickAction("Non ho capito bene un passaggio, puoi rispiegarmelo in un altro modo?")}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition duration-200 flex items-center gap-1 cursor-pointer select-none ${pillTheme}`}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>🔄 Non ho capito, rispiumalo</span>
                </button>
              </>
            )}

            {currentLevel !== 'maturita' && onUpgradeLevel && (
              <button
                id="btn-quick-level-up"
                onClick={onUpgradeLevel}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition duration-200 flex items-center gap-1 cursor-pointer select-none ${
                  levelColor === 'emerald'
                    ? 'bg-amber-550 border-amber-300 text-amber-900 hover:bg-amber-100'
                    : 'bg-rose-500 border-rose-300 text-white hover:bg-rose-600'
                }`}
              >
                <ArrowUp className="h-3.5 w-3.5 animate-bounce" />
                <span>🚀 Sali di livello (passa a {currentLevel === 'biennio' ? 'Triennio' : 'Maturità'})</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
