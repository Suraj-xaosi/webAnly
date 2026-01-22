

"use client";
import SidebarButton from "../../../appComponents/buttons/sidebarButton";
import { AppButton } from "../../../appComponents/buttons/appButton";
import { useState } from "react";
import { signOut } from "next-auth/react";

export default function LogoutLogic() {
	const [logoutLoading, setLogoutLoading] = useState(false);
	const handleLogout = async () => {
		setLogoutLoading(true);
		await signOut({ callbackUrl: "/login" });
		setLogoutLoading(false);
	};
	return (
		<SidebarButton label={<>🚪 Logout</>}>
			<p className="font-extrabold text-white mb-6 text-center drop-shadow">
				sure! you want to log out ?
			</p>
			<div className="flex gap-3 justify-center">
				<AppButton type="button" onClick={() => {}}>Cancel</AppButton>
				<AppButton type="button" onClick={handleLogout} loading={logoutLoading}>Yes, Logout</AppButton>
			</div>
		</SidebarButton>
	);
}
