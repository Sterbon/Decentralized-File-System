import React, { Component } from "react";
import getWeb3 from "./utils/getWeb3";
import OwnershipContract from "./contracts/Ownership.json"
import ipfs from "./ipfsCall";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import "react-tabs/style/react-tabs.css";
import Modal from 'react-awesome-modal';
import Card from './Card.js';
import ProfileBooks from './ProfileBooks.js';
import "./App.css";
import Slider from "react-slick";
import Dialog from '@material-ui/core/Dialog';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import InsightCard from './InsightCard.js'
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { AppBar, Fab } from "@material-ui/core";
import { View, pdfjs, Document, Page } from 'react-pdf';
import WheelReact from 'wheel-react';


// var Sentiment = require('sentiment');
// const sentiment = new Sentiment();

const vader = require('vader-sentiment');

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

class App extends Component {

	state = { numPages: null, pageNumber: 12, bookInsight: [], totalRented: null, totalComments: null, score: [], currentBook: null, commentHash: null, userComment: null, comment: [], url: null, earnings: null, totalSold: null, imageBuffer: null, bookImage: null, exists: false, visibleTimer: false, rentedBooks: [], rentHash: null, rent: null, rentDays: null, booksBoughtName: [], booksBought: [], wallet: null, current: [], visibleBook: false, bookDetails: [], prnt: false, render: true, visible: false, bookName: null, clientName: "utsav", token: 0, ownerName: null, price: 0, contentName: null, viewText: 'Show Preview', showPreview: false, fileMetadata: [], storageValue: [], web3: null, accounts: null, contract: null, buffer: null, ipfsHash: null };

	constructor(props) {
		super(props)

		this.getFile = this.getFile.bind(this);
		this.getImage = this.getImage.bind(this);
		this.submitFile = this.submitFile.bind(this);
		this.calcTime = this.calcTime.bind(this);
		this.loadHtml = this.loadHtml.bind(this);
		this.toggle = this.toggle.bind(this);
		this.buyToken = this.buyToken.bind(this);
		this.closeModal = this.closeModal.bind(this);
		this.checkView = this.checkView.bind(this);//view timer
		this.viewHandler = this.viewHandler.bind(this);
		this.viewTimerHandler = this.viewTimerHandler.bind(this);
		this.submitComment = this.submitComment.bind(this);
		this.onDocumentLoadSuccess = this.onDocumentLoadSuccess.bind(this);
		this.updatePage = this.updatePage.bind(this);
		this.onCopy = this.onCopy.bind(this);
	}

	componentDidMount = async () => {

		document.oncontextmenu = function () {
			alert('Disabled');
			return false;
		}

		document.body.style.overflowX = 'hidden';

		setInterval(() => this.getAll(), 400)
		setInterval(() => this.getCustomerCall(), 400)
		setInterval(() => this.getTotal(), 400)
		setInterval(() => this.getTotalScore(), 400)
		setInterval(() => this.getBookInsight(), 400)

		var self = this;
		window.addEventListener("keyup", function (e) {
			if (e.keyCode == 44) {
				self.setState({ prnt: true });
				console.log("pressed!")
			}
		});

		try {
			// Get network provider and web3 instance.
			const web3 = await getWeb3();

			// Use web3 to get the user's accounts.
			const accounts = await web3.eth.getAccounts();

			// Get the contract instance.
			const networkId = await web3.eth.net.getId();
			const deployedNetwork = OwnershipContract.networks[networkId];
			const instance = new web3.eth.Contract(
				OwnershipContract.abi,
				deployedNetwork && deployedNetwork.address,
			);
			instance.address = "0x29278d81143aee04cb46a53fcf6b06c706968f4d";
			// Set web3, accounts, and contract to the state, and then proceed with an
			// example of interacting with the contract's methods.
			this.setState({ web3, accounts, contract: instance });
			console.log(window.web3.getTransactionReceipt)
		} catch (error) {
			// Catch any errors for any of the above operations.
			alert(
				`Failed to load web3, accounts, or contract. Check console for details.`,
			);
			console.error(error);
		}
	};

	checkView() { //view timer
		if (this.state.render == false) {
			this.closeModal();
		}
	}

	uploadTransaction = async () => {
		const { accounts, contract, ipfsHash, contentName, ownerName, price, rent, rentDays, bookImage } = this.state;
		await contract.methods.uploadContent(ipfsHash, contentName, ownerName, price, rent, rentDays, bookImage).send({ from: accounts[0] });
		console.log("storage Value: ", this.state.storageValue);
	};

	buyTokenTransaction = async () => {
		const { contract, accounts, clientName, token } = this.state
		await contract.methods.buyTokens(token).send({ from: accounts[0] });
	};

	purchaseTransaction = async () => {
		console.log("Working");
		const { ipfsHash, contract, accounts } = this.state;
		await contract.methods.purchase(ipfsHash).send({ from: accounts[0] });
		console.log("Transaction Successful !");
	};

	setComment = async () => {
		const { contract, accounts, userComment, commentHash } = this.state;
		// const score = sentiment.analyze(userComment).score;
		const score = parseInt(vader.SentimentIntensityAnalyzer.polarity_scores(userComment).compound * 100);
		console.log(score)
		let negative = false;
		if (score < 0)
			negative = true;
		console.log(score)
		await contract.methods.addComment(userComment, commentHash, Math.abs(parseInt(score + 100)), negative).send({ from: accounts[0] });
	}

	getCustomerCall = async () => {
		const { contract, accounts, clientName } = this.state;
		const response = await contract.methods.getCustomer(accounts[0]).call();
		this.setState({ wallet: response[0]._hex, booksBought: response[1], rentedBooks: response[2] });
	};

	getAll = async () => {
		const { contract } = this.state;
		const response = await contract.methods.getAllBooks().call();
		this.setState({ bookDetails: response });
	};

	rentTranact = async () => {
		const { contract, accounts, rentHash } = this.state;
		await contract.methods.rentTransaction(rentHash).send({ from: accounts[0] });
	};

	// searchName
	getBookName = async () => {
		const { contract, commentHash } = this.state;
		const response = await contract.methods.searchName(commentHash).call();
		this.setState({ current: response });
		console.log("book name: ", this.state.current);
	};

	getTotal = async () => {
		const { contract, accounts } = this.state;
		const total = await contract.methods.getUploads(accounts[0]).call();
		this.setState({ totalSold: total[2], totalRented: total[3], earnings: total[1] });
	}

	getComments = async (commentHash) => {
		const { contract, accounts } = this.state;
		const comments = await contract.methods.getComments(commentHash).call();
		this.setState({ comment: comments });
	}

	getTotalScore = async () => {
		const { contract, accounts } = this.state;
		const scoreArray = await contract.methods.getTotalScore().call();
		this.setState({ score: scoreArray });
	}

	getTotalComments = async (hash) => {
		const { contract } = this.state;
		const scoreArray = await contract.methods.getTotalComments(hash).call();
		this.setState({ totalComments: parseInt(scoreArray._hex) });
		// console.log(this.state.totalComments)
	}

	getBookInsight = async () => {
		const { contract, accounts } = this.state;
		const insights = await contract.methods.getBooksInsight(accounts[0]).call();
		this.setState({ bookInsight: insights });
		// console.log(this.state.bookInsight)
	}

	onDocumentLoadSuccess = ({ numPages }) => {
		this.setState({ pageNumber: 1 })
		this.setState({ numPages });
		console.log({ numPages })
	}

	loadHtml() {
		return (`https://ipfs.io/ipfs/${this.state.ipfsHash}#toolbar=0`);
	}

	onCopy(e) {
		e.preventDefault();
   		e.nativeEvent.stopImmediatePropagation();
		alert('Not allowed');
	}

	openModal(hash) {
		if (this.state.render) {
			this.setState({
				visible: true,
				ipfsHash: hash
			});
		}
		else {
			this.setState({
				visible: false
			});
		}
	}

	openViewModal() {
		if (this.state.render) {
			this.setState({
				visibleTimer: true
			});
		}
	}

	closeViewModal() {
		this.setState({
			visibleTimer: false
		});
	}

	closeModal() {
		this.setState({
			visible: false
		});
	}

	getFile(event) {
		event.preventDefault()
		const file = event.target.files[0]
		const reader = new window.FileReader()
		reader.readAsArrayBuffer(file);
		console.log('buffer', this.state.buffer)

		reader.onloadend = () => {
			this.setState({ buffer: Buffer(reader.result) })
			console.log('buffer', this.state.buffer)
			this.setState({ ipfsHash: null })

			ipfs.files.add(this.state.buffer, (error, result) => {
				if (error) {
					console.error(error)
					return
				}
				this.setState({ ipfsHash: result[0].hash })
				Object.values(this.state.bookDetails).map((key, index) => {
					console.log(key[3])
					if (key[3] == this.state.ipfsHash) {
						console.log("exists" + this.state.exists)
						return (this.setState({ exists: true }))
					}
				});
				if (this.state.exists) {
					alert("This book already exists!")
				}
			})

		}
	}

	getImage(event) {
		event.preventDefault()
		const file = event.target.files[0]
		const reader = new window.FileReader()
		reader.readAsArrayBuffer(file);

		reader.onloadend = () => {
			this.setState({ imageBuffer: Buffer(reader.result) })
			console.log('Image buffer', this.state.imageBuffer)
			this.setState({ bookImage: null })

			ipfs.files.add(this.state.imageBuffer, (error, result) => {
				if (error) {
					console.error(error)
					return
				}
				this.setState({ bookImage: result[0].hash })
				console.log("Image Hash:", this.state.bookImage)
			})

		}
	}

	submitFile(event) {
		event.preventDefault();
		// console.log(sentiment.analyze(''))
		this.setState(this.uploadTransaction)
	}

	calcTime(timestamp) {
		if (timestamp) {
			var date = new Date(timestamp * 1000);
			return date.toLocaleTimeString;
		}
	}

	toggle() {
		this.setState({
			shown: !this.state.shown,
			viewText: 'Hide Preview'
		});
	}

	buyToken(event) {
		event.preventDefault();
		this.setState(this.buyTokenTransaction);
	}

	viewTimerHandler() {
		this.openViewModal();
	}

	viewHandler(value) {
		console.log(value);
		this.openModal(value);
	}

	bookHandler(value, name) {
		console.log(name);
		this.viewTimerHandler();
		this.setState({ commentHash: name })
		this.setState({ currentBook: value })
		this.getComments(name);
	}

	rentHandler(hash) {
		console.log(hash);
		this.setState({ rentHash: hash }, this.rentTranact);
	}

	buyHandler(hash) {
		this.setState({ ipfsHash: hash }, this.purchaseTransaction);
	}

	submitComment(event) {
		event.preventDefault();
		this.setState(this.setComment)
	}

	substr(str) {
		var start = str.slice(38, 42);
		var end = str.slice(0, 4);
		return (start + "..." + end);
	}

	updatePage() {
		
	}

	render() {
		const { pageNumber, numPages } = this.state;
		if (!this.state.web3) {
			return (
				<div className="metamask">
					<img className="headIcon" src={require('./iconBig.png')} />
					<p className="author"><strong>auth.or</strong></p>
					<div text-align="center">Install and login to <a href="http://www.metamask.io" target="_blank">MetaMask</a> to interact with the app! </div>
				</div>);
		}
		// var hidden = {
		// 	display: this.state.shown ? "block" : "none"
		// }

		WheelReact.config({
			up: () => {
				if(this.state.pageNumber != this.state.numPages)
				{
					this.setState({
						pageNumber: this.state.pageNumber + 1				  
					  });
				}
			},
			down: () => {
				if(this.state.pageNumber != 1)
				{
					this.setState({
					pageNumber: this.state.pageNumber - 1
				  });
				}
			}
		  });

		var settings = {
			dots: true,
			infinite: false,
			speed: 500,
			slidesToShow: 5,
			slidesToScroll: 4,
			initialSlide: 0,
			responsive: [
				{
					breakpoint: 1024,
					settings: {
						slidesToShow: 3,
						slidesToScroll: 3,
						infinite: true,
						dots: true
					}
				},
				{
					breakpoint: 600,
					settings: {
						slidesToShow: 2,
						slidesToScroll: 2,
						initialSlide: 2
					}
				},
				{
					breakpoint: 480,
					settings: {
						slidesToShow: 1,
						slidesToScroll: 1
					}
				}
			]
		};

		let totalPositive = 0;
		let totalNegative = 0;
		let totNeg = 0;
		let totPos = 0;
		var isNegative = false;

		Object.values(this.state.comment).map((key, index) => (
			isNegative = (key[2] == 'true'),
			isNegative ? totNeg = totNeg + 1 : totPos = totPos + 1,
			isNegative ? totalNegative = totalNegative - parseInt(key[1]) : totalPositive = totalPositive + parseInt(key[1])
		));

		const allBooks = Object.values(this.state.bookDetails).map((key, index) => (
			// this.getTotalComments(key[3]),
			// console.log(parseFloat((this.state.score[index]*5)/(200)).toFixed(1)),
			<Card onClick={() => this.bookHandler(key[1], key[3])}
				days={key[6]} rentPrice={key[5]} imag={key[4]} pname={key[0]} author={key[1]} price={key[2]}
				rentClick={() => this.rentHandler(key[3])} buyClick={() => this.buyHandler(key[3])}
				score={parseFloat((this.state.score[index] * 5) / (200)).toFixed(1)}
			/>
		));

		const booksList = Object.values(this.state.booksBought).map((key, index) => (
			<ProfileBooks imag={key[2]} pname={key[1]} onClick={() => this.viewHandler(key[0])} />
		));

		const rentList = Object.values(this.state.rentedBooks).map((key, index) => (
			<ProfileBooks imag={key[2]} pname={key[1]} onClick={() => this.viewHandler(key[0])} />
		));

		const bookComment = Object.values(this.state.booksBought).map((key, index) => (
			<ProfileBooks imag={key[2]} pname={key[1]} onClick={() => this.bookHandler(key[1], key[0])} />
		));

		const commentDetails = Object.values(this.state.comment).map((key, index) => (
			<p>{key[0]} <img width="15px" height="15px" src={require('./utils/tick.png')} /><hr /></p>

		));

		const insight = Object.values(this.state.bookInsight).map((key, index) => (
			<InsightCard
				bookName={key[0]} imag={key[1]} bought={key[2]}
				rented={key[3]} earning={key[4]} negative={key[5]}
				positive={key[6]} score={parseFloat((key[7] * 5) / 200).toFixed(1)}
				comments={() => this.bookHandler(key[0], key[8])}
			/>
		));

		return (
			<div className="App">

				<AppBar position='relative' color="primary">
					<div className="Header">
						<h1><img className="headIcon" src={require('./iconMain.png')} />auth.or</h1>
						<p><strong>My Address: </strong>{this.state.accounts[0]}</p>
						<p>Upload to IPFS and Secure by Ethereum</p>
						<p style={{ marginLeft: "80%", color: "white", position: 'sticky' }} ><strong>
							<Tooltip title="Wallet Balance">
								<img style={{ marginRight: "10px" }} src={require('./utils/wallet.png')} />
							</Tooltip>
							{parseInt(this.state.wallet)} ATC</strong>
						</p>
					</div>
				</AppBar>
				<Tabs>
					<AppBar style={{ height: "55px" }} position='sticky' color='inherit'>
						<TabList className="tabs">
							<Tab>Library</Tab>
							<Tab>Buy Tokens</Tab>
							<Tab>Upload</Tab>
							<Tab>My Books</Tab>
							<Tab>Add Review</Tab>
							<Tab>Author Insights</Tab>
						</TabList>
					</AppBar>

					<TabPanel >
						<div className="coins">
							{allBooks}
						</div>
						<Modal className="modal" visible={this.state.visibleTimer} width="40%" height="90%" effect="fadeInDown" onClickAway={() => this.closeViewModal()}>
							{/* <button onClick={() => this.closeViewModal()}>Close</button> */}
							<form onSubmit={this.submitComment}>
								<img className="cross" onClick={() => this.closeViewModal()} className='cross' src={require('./utils/cross1.png')} />
								<p><strong>Book Name: </strong>{this.state.currentBook}</p>
								<p className="totalPositive">{parseFloat((totalPositive * 5) / (200)).toFixed(1)}</p>
								<p className="totalNegative">{parseFloat(Math.abs((totalNegative * 5) / (200))).toFixed(1)}</p>
								<p className="comments">{commentDetails}</p>
								<TextField className="text" type='text' placeholder='Submit your review!' onInput={e => this.setState({ userComment: e.target.value })} />
								<button className="buy button"><span>Submit</span></button>
							</form>
						</Modal>
					</TabPanel>

					<TabPanel className="tab">

						<form className="form" onSubmit={this.buyToken}>
							<h3>Buy Tokens</h3>
							<TextField className="text" label="Tokens" type='text' onInput={e => this.setState({ token: e.target.value })} />
							<button className="buy button"><span>Buy </span></button>
						</form>
					</TabPanel>

					<TabPanel >

						<form className="form" onSubmit={(e) => this.submitFile(e)}>
							<h3>Select your file</h3>
							<label className="upload-label">Select Book:
								<input type='file' onChange={this.getFile} accept='application/pdf' />
							</label>
							<label>Select Book Image:
								<input type='file' onChange={this.getImage} accept='image/*' />
							</label>
							<br></br>
							<TextField margin="normal" variant="outlined" label="Title" type='text' onInput={e => this.setState({ contentName: e.target.value })} />
							<TextField margin="normal" variant="outlined" label="Owner Name" type='text' onInput={e => this.setState({ ownerName: e.target.value })} />
							<TextField margin="normal" variant="outlined" label="Purchase Price" type='text' onInput={e => this.setState({ price: e.target.value })} />
							<TextField margin="normal" variant="outlined" label="Rent Price" type='text' onInput={e => this.setState({ rent: e.target.value })} />
							<TextField margin="normal" variant="outlined" label="Rent Duration" placeholder="In Days" type='text' onInput={e => this.setState({ rentDays: e.target.value })} />
							<button id='upload' className="button"><span>Upload</span></button><br></br>

							<div className="hash-div">
								<strong>IPFS Hash: </strong>
								<span className="hashLink" onClick={() => this.openModal(this.state.ipfsHash)}>{this.state.ipfsHash}</span>
							</div>
						</form>

						<Modal className="modal" visible={this.state.visible} width="100%" height="100%" effect="fadeInUp" onClickAway={() => this.closeModal()}>
							<img className="cross" onClick={() => this.closeModal()} className='cross' src={require('./utils/cross1.png')} />
							{/* iframe height="100%" width="100%" className="preview" src={this.loadHtml()} ></iframe> */}

						</Modal>

					</TabPanel>

					<TabPanel>
						<div>
							{
								(this.state.booksBought.length == 0) ?
									<p></p>
									:
									<div> <h3>Books Bought</h3>
										<Slider {...settings} >
											{booksList}
										</Slider>
										<hr></hr>
									</div>
							}

							{
								(this.state.rentedBooks.length == 0) ?
									<p></p>
									:
									<div> <h3>Books Rented</h3>
										<Slider {...settings} >
											{rentList}
										</Slider>
									</div>
							}
						</div>

						<Modal className="modal" visible={this.state.visible} height='100%' width='100%' effect="fadeInUp" onClickAway={() => this.closeModal()}>
							<img className="cross" onClick={() => this.closeModal()} className='cross' src={require('./utils/cross1.png')} />
							<div onCopy={this.onCopy} {...WheelReact.events} align="center" className="container" >
								<Document
									file={"https://ipfs.io/ipfs/" + this.state.ipfsHash}
									onLoadSuccess={this.onDocumentLoadSuccess}
								>
									{/* <View> */}
									<Page  className='page' pageNumber={pageNumber} />
									{/* </View> */}
								</Document>
								<p>Page {pageNumber} of {numPages}</p>
							</div>
						</Modal>

					</TabPanel>

					<TabPanel>
						<div>
							<div>
								<Slider {...settings} >
									{bookComment}
								</Slider>
							</div>
							<div>
								<form className="form" onSubmit={this.submitComment}>
									<p><strong>Book Name: </strong>{this.state.currentBook}</p>
									<TextField margin="normal" variant="standard" label="Write a review!" className="text" type='text' onInput={e => this.setState({ userComment: e.target.value })} />
									<button className="buy button"><span>Submit</span></button>
								</form>
							</div>
						</div>
						{/* :
							<div>
								<img src={require('./utils/nothing.png')}></img>
								<p className="empty-heading">Wow! Such empty.</p>
							</div>	 */}

					</TabPanel>

					<TabPanel className="insights">
						<div>
							<div className="section-div">
								<section className='section'>
									<h3>Books Sold </h3>
									<h1 className="head">{parseInt(this.state.totalSold)}</h1>
								</section>
								<section className='section'>
									<h3>Books Rented </h3>
									<h1 className="head">{parseInt(this.state.totalRented)}</h1>
								</section>
								<section className='section'>
									<h3>Earnings</h3>
									<h1 className="head">{parseInt(this.state.earnings) + " ATC"}</h1>
								</section>
							</div>
							<div className='insightCard'>
								{insight}
							</div>
							<Modal className="modal" visible={this.state.visibleTimer} width="40%" height="90%" effect="fadeInDown" onClickAway={() => this.closeViewModal()}>
								<img className="cross" onClick={() => this.closeViewModal()} className='cross' src={require('./utils/cross1.png')} />
								<p><strong>Book Name: </strong>{this.state.currentBook}</p>
								<p className="comments">{commentDetails}</p>
							</Modal>
						</div>
					</TabPanel>
				</Tabs>


			</div>
		);
	}
}
export default App;
