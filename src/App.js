import React, { Component } from 'react';
// import type { Container, Engine } from "tsparticles-engine";
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';
import FaceRecognition from './components/FaceRecognition/FaceRecognition'
import Navigation from './components/Navigation/Navigation';
import SignIn from './components/SignIn/SignIn';
import Register from './components/Register/Register';
import Logo from './components/Logo/Logo';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import Rank from './components/Rank/Rank';
import './App.css';

const USER_ID = 'haverh';
const PAT = 'ba1cf962af4741d28934e6bcc44f2325';
const APP_ID = 'face-recognition';
const MODEL_ID = 'face-detection';
const MODEL_VERSION_ID = '6dc7e46bc9124c5c8824be4822abe105';


const particlesInit = async (main) => {
	// you can initialize the tsParticles instance (main) here, adding custom shapes or presets
	// this loads the tsparticles package bundle, it's the easiest method for getting everything ready
	// starting from v2 you can add only the features you need reducing the bundle size
	await loadFull(main);
};

const particlesOptions = {
		fpsLimit: 120,
		interactivity: {
			events: {
				onClick: {
					enable: false,
					mode: "push",
				},
				onHover: {
					enable: true,
					mode: "repulse",
				},
				resize: true,
			},
			modes: {
				push: {
					quantity: 2,
				},
			repulse: {
				distance: 100,
				duration: 0.2,
			},
		},
	},
	particles: {
		color: {
			value: "#ffffff",
		},
		links: {
			color: "#ffffff",
			distance: 150,
			enable: true,
			opacity: 0.5,
			width: 1,
		},
		collisions: {
			enable: true,
		},
		move: {
			direction: "none",
			enable: true,
			outModes: {
				default: "bounce",
			},
			random: false,
			speed: 2,
         straight: true,
		},
		number: {
			density: {
				enable: true,
				area: 1000,
			},
			value: 80,
		},
		opacity: {
			value: 0.5,
		},
		shape: {
			type: ["polygon", "triangle"],
		},
		size: {
			value: { min: 1, max: 4 },
		},
	},
	detectRetina: true,
};

class App extends Component {
	constructor() {
		super();
		this.state = {
			input: '',
			imgURL: '',
			box: {},
			route: 'signin',
			isSignedIn: false,
			user: {
				id: '',
				name: '',
				email: '',
				entries: 0,
				joined: ''
			}
		}
	}

	loadUser = (data) => {
		this.setState({user: {
			id: data.id,
			name: data.name,
			email: data.email,
			entries: data.entries,
			joined: data.joined
		}})
	}

	calculateBoxLocation = (data) => {
		const clarifaiFace = data.region_info.bounding_box;
		const image = document.getElementById('inputImg');
		const width = Number(image.width);
		const height = Number(image.height);
		return {
			leftCol: clarifaiFace.left_col * width,
			topRow: clarifaiFace.top_row * height,
			rightCol: width - (clarifaiFace.right_col * width),
			bottomRow: height - (clarifaiFace.bottom_row * height)
		}
	}

	displayBox = (box) => {
		console.log(box);
		this.setState({box: box});
	}

	onInputChange = (event) => {
		this.setState({input: event.target.value});
	}

	onPictureSubmit = () => {
		this.setState({imgURL: this.state.input});

		const raw = JSON.stringify({
			"user_app_id": {
				"user_id": USER_ID,
				"app_id": APP_ID
        },
        "inputs": [
    			{
					"data": {
						"image": {
							"url": this.state.input
						}
					}
				}
			]
		});

		const requestOptions = {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Authorization': 'Key ' + PAT
			},
			body: raw
		};

		fetch("https://api.clarifai.com/v2/models/" + MODEL_ID + "/versions/" + MODEL_VERSION_ID + "/outputs", requestOptions)
		.then( response => response.json() )
		.then( result => {
			if ( result ) {
				fetch('http://localhost:3001/image', {
					method: 'put',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify({
						id: this.state.user.id
				})
				})
				.then(response => response.json())
				.then(count => {
					this.setState(Object.assign(this.state.user, { entries: count }))
				})
			}
			this.displayBox(this.calculateBoxLocation(result.outputs[0].data.regions[0]))
		})
		.catch( error => console.log(error) );
	}

	onRouteChange = (route) => {
		if (route === 'signout') {
			this.setState({isSignedIn: false});
		}else if (route === 'home') {
			this.setState({isSignedIn: true});
		}
		this.setState({route: route});
	}

	render() {
		const { isSignedIn, imgURL, route, box } = this.state;
		return (
		<div className="App">
			<Particles className='particles'
				init={particlesInit}
				options = {particlesOptions}
			/>
			<Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange}/>
			{ route === 'home'
				? <div>
						<Logo />
						<Rank name={this.state.user.name} entries={this.state.user.entries}/>
						<ImageLinkForm
							onInputChange={this.onInputChange}
							onPictureSubmit={this.onPictureSubmit}
						/>
						<FaceRecognition 
							box={box}
							imageURL={imgURL} />
					</div>
				: (
					route === 'signin'
					? <SignIn loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>
					: <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>
					)
			}
		</div>
	);
	}
}

export default App;
