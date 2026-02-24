
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setSiteId, setFromDate, setToDate, setInterval} from "../../../store/slices/selectedDateSiteSlice";
import { useState } from "react";
import PopupCard from "../../appComponents/cards/popupCard";
import AppInput from "../../appComponents/input/appInput";
import { AppButton } from "../../appComponents/buttons/appButton";

interface ControlsProps {
	open: boolean;
	onClose: () => void;
}

export default function Controls({ open, onClose }: ControlsProps) {
	const dispatch = useAppDispatch();
	const sites = useAppSelector((s) => s.site.sites);
	const selectedSiteId = useAppSelector((s) => s.selectedDateSiteId.siteId);
	const [fromdateInput, setDateInput] = useState("");
	const [todateInput, setToDateInput] = useState("");
	const [interval, setlocalInterval] = useState("hour");

	const handleDateSubmit = () => {
		if (!fromdateInput || !todateInput || !interval) return;

		if (new Date(fromdateInput) > new Date(todateInput)) {
			alert("'From' date cannot be later than 'To' date.");
			return;
		}

		dispatch(setFromDate(fromdateInput));

		if (interval === "hour") {
			alert("Hour interval selected, data to will be set to 'From' date.");
			dispatch(setToDate(fromdateInput));
		} else {
			dispatch(setToDate(todateInput));
		}
		
		dispatch(setInterval(interval));
		
		alert("Date range and interval updated!");
		onClose();
	};

	return (
		<PopupCard open={open} onClose={onClose}>
			<h2 className="text-2xl font-bold text-white mb-2 text-center">Controls</h2>
			{/* Site Selector */}
			{sites.length > 0 && (
				<div className="mb-2">
					<label className="block text-white font-semibold mb-2">Select Site:</label>
					<select
						value={selectedSiteId || ""}
						onChange={(e) => dispatch(setSiteId(e.target.value))}
						className="bg-[#A78BFA] text-white px-4 py-2 rounded-lg border border-purple-400 focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm w-full transition"
					>
						{sites.map((site) => (
							<option key={site.id} value={site.id} className="text-black">
								{site.domain}
							</option>
						))}
					</select>
				</div>
			)}
			{/* Date Input */}
			<div className="flex flex-col gap-4">
				<label className="text-white font-semibold">Select Dates:</label>
				<div className="flex gap-2">
					<div className="flex flex-col w-1/2">
						<span className="text-sm text-white mb-1">From</span>
						<AppInput
							type="date"
							value={fromdateInput}
							max={new Date().toISOString().split("T")[0]}
							onChange={(e) => setDateInput(e.target.value)}
							name="fromdate"
						/>
					</div>
					<div className="flex flex-col w-1/2">
						<span className="text-sm text-white mb-1">To</span>
						<AppInput
							type="date"
							value={todateInput}
							max={new Date().toISOString().split("T")[0]}
							onChange={(e) => setToDateInput(e.target.value)}
							name="todate"
						/>
					</div>
				</div>
			</div>
			{/* Interval Selector */}
			<div className="flex flex-col gap-2">
				<label className="text-white font-semibold">Interval</label>
				<select
					value={interval}
					onChange={(e) => setlocalInterval(e.target.value)}
					className="bg-[#A78BFA] text-white px-4 py-2 rounded-lg border border-purple-400 focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm w-full transition"
				>
					<option value="day">Day</option>
					<option value="hour">Hour</option>
					<option value="week">Week</option>
					<option value="month">Month</option>
				</select>
			</div>
			{/* Apply Button */}
			<AppButton type="button" onClick={handleDateSubmit}>
				Apply
			</AppButton>
		</PopupCard>
	);
}
