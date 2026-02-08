import { StaticTimePicker, TimeView } from "@mui/x-date-pickers";
import { PickerValue } from "@mui/x-date-pickers/internals";
import { useEffect, useState } from "react";

export default function TimePicker({
  value,
  activeClockId,
  onSelect,
}: {
  value: PickerValue;
  activeClockId: string;
  onSelect: (value: PickerValue) => void;
}) {
  const [view, setView] = useState<TimeView>("hours");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setView("hours");
  }, [activeClockId]);

  return (
    <StaticTimePicker
      className="[direction:ltr]"
      value={value}
      onChange={onSelect}
      view={view}
      onViewChange={setView}
    />
  );
}
