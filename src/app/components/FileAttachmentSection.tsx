import React from 'react';
import { AlertCircle, CheckCircle2, FileText, Paperclip, Upload, X } from 'lucide-react';
import clsx from 'clsx';

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

export interface FileSlot {
  id: string;
  label: string;
  required: boolean;
  file: FileAttachment | null;
}

interface FileAttachmentSectionProps {
  slots: FileSlot[];
  onSlotFileChange: (slotId: string, file: FileAttachment | null) => void;
  checkItems?: {
    id: string;
    label: string;
    icon: React.ReactNode;
    checked: boolean;
    onChange: (value: boolean) => void;
  }[];
}

function formatSize(bytes: number) {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function toAttachment(file: File): FileAttachment {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    size: file.size,
    type: file.type,
    progress: 100,
    status: 'completed',
  };
}

export function FileAttachmentSection({
  slots,
  onSlotFileChange,
  checkItems = [],
}: FileAttachmentSectionProps) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold text-[#62748e] tracking-[0.06px] uppercase flex items-center gap-2">
        <Paperclip size={12} />
        첨부 파일 및 인계 확인
      </p>

      <div className="space-y-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
        <div className="space-y-2">
          {slots.map((slot) => (
            <div key={slot.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-700">{slot.label}</p>
                    {slot.required && (
                      <span
                        className={clsx(
                          'rounded-full px-1.5 py-0.5 text-[9px] font-bold border',
                          slot.file
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-rose-200 bg-rose-50 text-rose-600',
                        )}
                      >
                        {slot.file ? '첨부됨' : '필수'}
                      </span>
                    )}
                  </div>
                  {slot.file ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-500">
                        <FileText size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-700">{slot.file.name}</p>
                        <p className="text-[10px] text-slate-400">{formatSize(slot.file.size)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-slate-400">아직 업로드된 파일이 없습니다.</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <label
                    htmlFor={`file-slot-${slot.id}`}
                    className="inline-flex h-8 cursor-pointer items-center gap-1 rounded border border-slate-300 bg-slate-50 px-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                  >
                    <Upload size={12} />
                    {slot.file ? '변경' : '업로드'}
                  </label>
                  <input
                    id={`file-slot-${slot.id}`}
                    type="file"
                    className="hidden"
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0];
                      onSlotFileChange(slot.id, nextFile ? toAttachment(nextFile) : null);
                      event.currentTarget.value = '';
                    }}
                  />
                  {slot.file && (
                    <button
                      type="button"
                      onClick={() => onSlotFileChange(slot.id, null)}
                      className="inline-flex h-8 items-center justify-center rounded border border-slate-200 bg-white px-2 text-slate-400 hover:text-rose-500"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {checkItems.length > 0 && (
          <div className="space-y-2 border-t border-slate-200 pt-3">
            {checkItems.map((item) => (
              <label
                key={item.id}
                className={clsx(
                  'flex items-center gap-2 rounded border px-3 py-2.5 transition-all cursor-pointer',
                  item.checked
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                )}
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(event) => item.onChange(event.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                {item.icon}
                <span className={clsx('flex-1 text-xs font-medium', item.checked ? 'text-emerald-700' : 'text-slate-600')}>
                  {item.label}
                </span>
                {item.checked ? (
                  <CheckCircle2 size={12} className="text-emerald-500" />
                ) : (
                  <AlertCircle size={12} className="text-slate-300" />
                )}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
