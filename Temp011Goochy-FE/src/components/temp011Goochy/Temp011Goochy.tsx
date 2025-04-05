import { useState, useEffect } from "react";
import Temp011GoochyComponent from "./Temp011GoochyComponent";
import { DataService } from "../../services/DataService";
import { NavLink } from "react-router-dom";
import { Temp011GoochyEntry } from "../model/model";

interface Temp011GoochyProps {
	dataService: DataService;
}

export default function Temp011Goochy(props: Temp011GoochyProps) {
	const [temp011Goochy, setTemp011Goochy] = useState<Temp011GoochyEntry[]>();
	const [reservationText, setReservationText] = useState<string>();

	useEffect(() => {
		const getTemp011Goochy = async () => {
			console.log("getting temp011Goochy....");
			const temp011Goochy = await props.dataService.getTemp011Goochy();
			setTemp011Goochy(temp011Goochy);
		};
		getTemp011Goochy();
	}, []); //Keep the array empty to run the effect only once (otherwise it will run on every render and cost $$)

	async function reserveTemp011Goochy(
		temp011GoochyId: string,
		temp011GoochyName: string
	) {
		const reservationResult = await props.dataService.reserveTemp011Goochy(
			temp011GoochyId
		);
		setReservationText(
			`You reserved ${temp011GoochyName}, reservation id: ${reservationResult}`
		);
	}

	function renderTemp011Goochy() {
		if (!props.dataService.isAuthorized()) {
			return <NavLink to={"/login"}>Please login</NavLink>;
		}
		const rows: any[] = [];
		if (temp011Goochy) {
			for (const temp011GoochyEntry of temp011Goochy) {
				rows.push(
					<Temp011GoochyComponent
						key={temp011GoochyEntry.id}
						id={temp011GoochyEntry.id}
						location={temp011GoochyEntry.location}
						name={temp011GoochyEntry.name}
						photoUrl={temp011GoochyEntry.photoUrl}
						reserveTemp011Goochy={reserveTemp011Goochy}
					/>
				);
			}
		}

		return rows;
	}

	return (
		<div>
			<h2>Welcome to the Temp011Goochy page!</h2>
			{reservationText ? <h2>{reservationText}</h2> : undefined}
			{renderTemp011Goochy()}
		</div>
	);
}
