import React, { Component } from 'react';
import './InsightCard.css';
import { Tooltip } from '@material-ui/core';
import Rating from "@material-ui/lab/Rating";
import { fontSize } from '@material-ui/system';

class InsightCard extends Component {
    render() {

        return (
            <React.Fragment>
                <div className='bookDisplay' onClick={this.props.onClick}>
                    <section>
                    <h4>{this.props.bookName}</h4>
                        <div className='bookwise'>
                            <div className='image-book'>
                                <img className='image' src={(`https://ipfs.io/ipfs/${this.props.imag}`)}></img>
                            </div>
                            <div className='textbox'>
                                <Rating className='score' name="half-rating" value={this.props.score} precision={0.5} readOnly />
                                <div className='numbers'>
                                    <div className='purchase'>
                                        <p>Bought <strong>{this.props.bought}</strong></p>
                                        <hr></hr>
                                        <p>Rented <strong>{this.props.rented}</strong></p>
                                    </div>
                                    <p>Earning  <strong>{this.props.earning} ATC</strong> </p>
                                </div>
                                <div className='numbers'>
                                    <div className='purchase'>
                                        <p>Positive <strong>{this.props.positive}</strong></p>
                                        <hr></hr>
                                        <p>Negative <strong>{this.props.negative}</strong></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Tooltip placement="left-start" title='Read what people said!'>
                            <img className='review' src={require('./utils/review.png')}></img>
                        </Tooltip>
                    </section>
                </div>
            </React.Fragment>
        );
    }
}

export default InsightCard;