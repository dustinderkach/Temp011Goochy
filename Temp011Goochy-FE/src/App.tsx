import "./App.css";
import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";
import NavBar from "./components/NavBar";
import { useState } from "react";
import LoginComponent from "./components/LoginComponent";
import { AuthService } from "./services/AuthService";
import { DataService } from "./services/DataService";
import CreateTemp011Goochy from "./components/temp011Goochy/CreateTemp011Goochy";
import Temp011Goochy from "./components/temp011Goochy/Temp011Goochy";

const authService = new AuthService();
const dataService = new DataService(authService);

function App() {
	const [userName, setUserName] = useState<string | undefined>(undefined);

	const router = createBrowserRouter([
		{
			element: (
				<>
					<NavBar userName={userName} />
					<Outlet />
				</>
			),
			children: [
				{
					path: "/",
					element: <div>Hello world!</div>,
				},
				{
					path: "/login",
					element: (
						<LoginComponent
							authService={authService}
							setUserNameCb={setUserName}
						/>
					),
				},
				{
					path: "/profile",
					element: <div>Profile page</div>,
				},
				{
					path: "/createTemp011Goochy",
					element: <CreateTemp011Goochy dataService={dataService} />,
				},
				{
					path: "/temp011Goochy",
					element: <Temp011Goochy dataService={dataService} />,
				},
			],
		},
	]);

	return (
		<div className="wrapper">
			<RouterProvider router={router} />
		</div>
	);
}

export default App;
