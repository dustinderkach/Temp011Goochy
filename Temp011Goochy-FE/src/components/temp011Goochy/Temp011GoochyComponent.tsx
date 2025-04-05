import genericImage from "../../assets/generic-photo.jpg";
import { Temp011GoochyEntry } from "../model/model";
import "./Temp011GoochyComponent.css";

interface Temp011GoochyComponentProps extends Temp011GoochyEntry {
	reserveTemp011Goochy: (temp011GoochyId: string, temp011GoochyName: string) => void;
}

export default function Temp011GoochyComponent(props: Temp011GoochyComponentProps) {
	function renderImage() {
		if (props.photoUrl) {
			return <img src={props.photoUrl} />;
		} else {
			return <img src={genericImage} />;
		}
	}

	return (
		<div className="temp011GoochyComponent">
			{renderImage()}
			<label className="name">{props.name}</label>
			<br />
			<label className="location">{props.location}</label>
			<br />
			<button
				onClick={() => props.reserveTemp011Goochy(props.id, props.name)}
			>
				Reserve
			</button>
		</div>
	);
}
