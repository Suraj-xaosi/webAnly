"use client";


import SidebarButton from "../../../appComponents/buttons/sidebarButton";
import { AppButton } from "../../../appComponents/buttons/appButton";
import AppInput from "../../../appComponents/input/appInput";
import { useState } from "react";
import { useAppDispatch } from "../../../../store/hooks";
import { fetchSiteInfo } from "../../../../store/slices/sitesSlice";
import { addingSite } from "../../../../lib/sActions/addingSite";

export default function AddSite() {
	const [site, setSite] = useState("");
	const [addSiteError, setAddSiteError] = useState("");
	const [addSiteLoading, setAddSiteLoading] = useState(false);
	const dispatch = useAppDispatch();

	const handleAddSite = async (e: any) => {
		e.preventDefault();
		setAddSiteLoading(true);
		setAddSiteError("");
		const result = await addingSite(site);
		if (result?.error) {
			setAddSiteError(result.error);
			setAddSiteLoading(false);
			return;
		}
		dispatch(fetchSiteInfo());
		alert("Site added!");
		setSite("");
		setAddSiteLoading(false);
	};

	return (
		<SidebarButton label={<>➕ Add domain</>}>
			<h2 className="text-xl font-semibold text-purple-300 mb-4">Add a new domain</h2>
			<form onSubmit={handleAddSite} className="space-y-4">
				<AppInput
					disabled={addSiteLoading}
					value={site}
					onChange={e => setSite(e.target.value)}
					placeholder="example.com"
				/>
				{addSiteError && (
					<p className="text-red-300 text-sm bg-red-500/10 p-2 rounded">{addSiteError}</p>
				)}
				<AppButton type="submit" loading={addSiteLoading}>Add domain</AppButton>
			</form>
		</SidebarButton>
	);
}
