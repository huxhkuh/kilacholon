import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EntryFilter({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="filter-field">
      <span className="filter-label">{label}</span>
      <Select dir="rtl" value={value || "all"} onValueChange={value => onChange(value === "all" ? "" : value)}>
        <SelectTrigger aria-label={label}><SelectValue /></SelectTrigger>
        <SelectContent><SelectGroup>
          {options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
        </SelectGroup></SelectContent>
      </Select>
    </div>
  );
}
