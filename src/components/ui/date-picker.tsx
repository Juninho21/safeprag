import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

interface DatePickerProps {
  value?: Date;
  onChange?: (date?: Date) => void;
  placeholder?: string;
}

export function DatePicker({ value, onChange, placeholder }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "P", { locale: ptBR }) : placeholder || "Selecione uma data"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white shadow-lg border border-gray-200" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
          className="bg-white rounded-lg"
          classNames={{
            months: "space-y-4",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium text-gray-900",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity",
              "hover:bg-gray-100 rounded-lg",
              "disabled:opacity-30 disabled:hover:bg-transparent"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: cn(
              "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
              "text-center"
            ),
            row: "flex w-full mt-2",
            cell: cn(
              "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
              "h-9 w-9 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
              "first:text-red-500 last:text-red-500",
              "[&:has([aria-selected])]:bg-gray-100",
            ),
            day: cn(
              "h-9 w-9 p-0 font-normal",
              "aria-selected:opacity-100"
            ),
            day_range_end: "day-range-end",
            day_selected: cn(
              "bg-blue-600 text-white hover:bg-blue-700 hover:text-white",
              "rounded-lg transition-colors focus:outline-none"
            ),
            day_today: "bg-gray-100 text-gray-900",
            day_outside: "text-gray-400 opacity-50",
            day_disabled: "text-gray-400 opacity-50",
            day_range_middle: "aria-selected:bg-gray-100 aria-selected:text-gray-900",
            day_hidden: "invisible",
          }}
          components={{
            IconLeft: ({ ...props }) => <CalendarIcon className="h-4 w-4" {...props} />,
            IconRight: ({ ...props }) => <CalendarIcon className="h-4 w-4" {...props} />,
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
