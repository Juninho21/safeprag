import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col space-y-4",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-gray-900",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 text-gray-600 hover:bg-gray-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: cn(
          "text-gray-500 rounded-md w-9 font-normal text-[0.8rem] text-center"
        ),
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "h-9 w-9 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
          "first:text-red-500 last:text-red-500",
          "[&:has([aria-selected])]:bg-gray-100"
        ),
        day: cn(
          "h-9 w-9 p-0 font-normal text-center",
          "hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
