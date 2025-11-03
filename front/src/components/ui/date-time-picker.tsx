import React, { forwardRef, useState, useEffect } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { ptBR } from "date-fns/locale/pt-BR";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, Clock, Home } from "lucide-react";
import { parse, isValid, format } from "date-fns";

registerLocale("pt-BR", ptBR);

interface DateTimePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  placeholderText?: string;
  required?: boolean;
  className?: string;
}

const applyDateTimeMask = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  
  let masked = "";
  for (let i = 0; i < numbers.length && i < 12; i++) {
    if (i === 2 || i === 4) {
      masked += "/";
    } else if (i === 8) {
      masked += " ";
    } else if (i === 10) {
      masked += ":";
    }
    masked += numbers[i];
  }
  
  return masked;
};

const parseInputDate = (value: string | undefined): Date | null => {
  if (!value) return null;
  
  const cleanValue = value.trim();
  
  if (cleanValue.length >= 16) {
    const parsed = parse(cleanValue, "dd/MM/yyyy HH:mm", new Date());
    if (isValid(parsed)) return parsed;
  }
  
  return null;
};

const CustomInput = forwardRef<HTMLInputElement, any>(
  ({ value, onClick, onChange, placeholderText, onChangeRaw, onBlur }, ref) => {
    const [inputValue, setInputValue] = useState(value || "");

    useEffect(() => {
      setInputValue(value || "");
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      const maskedValue = applyDateTimeMask(newValue);
      
      setInputValue(maskedValue);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(e);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (onClick) {
        onClick(e as any);
      }
    };

    return (
      <div className="relative">
        <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-500 pointer-events-none z-10" />
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          ref={ref}
          placeholder={placeholderText}
          maxLength={16}
          className="w-full px-4 py-2.5 pl-11 pr-11 text-left border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-white text-gray-900 font-medium"
        />
        <Clock className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    );
  }
);

CustomInput.displayName = "CustomInput";

export function DateTimePicker({
  selected,
  onChange,
  minDate,
  placeholderText = "dd/mm/aaaa às hh:mm",
  required = false,
  className = "",
}: DateTimePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleChange = (date: Date | null) => {
    onChange(date);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const parsedDate = parseInputDate(inputValue);
    
    if (parsedDate && isValid(parsedDate)) {
      onChange(parsedDate);
    }
  };

  const filterPassedTime = () => {
    return true;
  };

  return (
    <div className={className}>
      <DatePicker
        selected={selected}
        onChange={handleChange}
        onBlur={handleBlur}
        onMonthChange={setCurrentMonth}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={10}
        timeCaption="Hora"
        dateFormat="dd/MM/yyyy HH:mm"
        minDate={minDate}
        placeholderText={placeholderText}
        customInput={<CustomInput placeholderText={placeholderText} />}
        required={required}
        locale="pt-BR"
        calendarClassName="shadow-xl border border-gray-200 rounded-lg"
        wrapperClassName="w-full"
        popperClassName="z-50"
        popperPlacement="bottom-start"
        showPopperArrow={false}
        isClearable={false}
        enableTabLoop={false}
        autoComplete="off"
        fixedHeight
        filterTime={filterPassedTime}
        strictParsing={false}
        renderCustomHeader={({
          date,
          changeYear,
          changeMonth,
        }) => {
          const months = [
            "janeiro", "fevereiro", "março", "abril", "maio", "junho",
            "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
          ];
          const years = Array.from({ length: 126 }, (_, i) => 1900 + i);
          
          const handleGoToToday = () => {
            const today = new Date();
            changeYear(today.getFullYear());
            changeMonth(today.getMonth());
            setCurrentMonth(today);
          };
          
          const checkIsCurrentMonth = () => {
            const today = new Date();
            return date.getMonth() === today.getMonth() && 
                   date.getFullYear() === today.getFullYear();
          };
          
          return (
            <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <select
                value={months[date.getMonth()]}
                onChange={({ target: { value } }) => changeMonth(months.indexOf(value))}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  padding: '6px 10px',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: '#111827',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '100px'
                }}
              >
                {months.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={date.getFullYear()}
                onChange={({ target: { value } }) => changeYear(Number(value))}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  padding: '6px 10px',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: '#111827',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '70px'
                }}
              >
                {years.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button
                onClick={handleGoToToday}
                type="button"
                title="Ir para hoje"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  color: '#2563eb',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #dbeafe',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  width: '32px',
                  height: '32px',
                  opacity: checkIsCurrentMonth() ? 0 : 1,
                  pointerEvents: checkIsCurrentMonth() ? 'none' : 'auto',
                  visibility: checkIsCurrentMonth() ? 'hidden' : 'visible'
                }}
                onMouseEnter={(e) => {
                  if (!checkIsCurrentMonth()) {
                    e.currentTarget.style.backgroundColor = '#dbeafe';
                    e.currentTarget.style.borderColor = '#2563eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!checkIsCurrentMonth()) {
                    e.currentTarget.style.backgroundColor = '#eff6ff';
                    e.currentTarget.style.borderColor = '#dbeafe';
                  }
                }}
              >
                <Home size={16} />
              </button>
            </div>
          );
        }}
      />
      <style>{`
        .react-datepicker {
          font-family: inherit;
          border: none;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        .react-datepicker__header {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          border-radius: 0.5rem 0.5rem 0 0;
          padding: 0;
        }
        .react-datepicker__day-name {
          color: #000000;
          font-weight: 500;
          font-size: 0.875rem;
        }
        .react-datepicker__day {
          color: #374151;
          border-radius: 0.375rem;
          transition: all 0.15s;
        }
        .react-datepicker__day:hover {
          background-color: #e0e7ff;
          color: #4f46e5;
        }
        .react-datepicker__day--selected {
          background: linear-gradient(to right, #2563eb, #9333ea) !important;
          color: white !important;
          font-weight: 600;
        }
        .react-datepicker__day--selected.react-datepicker__day--today {
          background: linear-gradient(to right, #2563eb, #9333ea) !important;
          color: white !important;
          font-weight: 600;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: #dbeafe;
          color: #1e40af;
        }
        .react-datepicker__day--today {
          background-color: #eff6ff !important;
          color: #2563eb !important;
          font-weight: 500;
        }
        .react-datepicker__day--today:hover {
          background-color: #e0e7ff !important;
          color: #4f46e5 !important;
        }
        .react-datepicker__day--disabled {
          color: #d1d5db !important;
        }
        .react-datepicker__time-container {
          border-left: none;
        }
        .react-datepicker__time-container .react-datepicker__time {
          background: white;
        }
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box {
          width: 100%;
        }
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list {
          padding: 0;
        }
        .react-datepicker__time-list-item {
          height: 36px !important;
          padding: 8px 12px !important;
          transition: all 0.15s;
        }
        .react-datepicker__time-list-item:hover {
          background-color: #e0e7ff !important;
          color: #4f46e5 !important;
        }
        .react-datepicker__time-list-item--selected {
          background: linear-gradient(to right, #2563eb, #9333ea) !important;
          color: white !important;
          font-weight: 600 !important;
        }

        .react-datepicker__input-container input {
          cursor: text !important;
        }
      `}</style>
    </div>
  );
}