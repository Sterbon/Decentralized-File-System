import React, { Component } from 'react';
import './Card.css';
import { Tooltip } from '@material-ui/core';
import Rating from "@material-ui/lab/Rating";

class Card extends Component {
    render() {
        return (
          
            <React.Fragment>
                <div className="card" >
                    <img className="image" alt="product" src={`https://ipfs.io/ipfs/${this.props.imag}`} align="middle"/>
                    <div className="review">
                        <Tooltip placement="right-start" title="Reviews">
                            <img onClick={this.props.onClick} src={require('./utils/review.png')} />    
                        </Tooltip>
                        <Tooltip placement="left-start" title="Book Rating">
                            <Rating className='score' name="half-rating" value={3.6} precision={0.1} readOnly />
                        </Tooltip>
                    </div>

                    <div className="p-des">
                        <p><strong>Book Name : </strong>{this.props.author}</p>
                        <p><strong>Author : </strong>{this.props.pname}</p>
                        <p><strong>Purchase Price : </strong>{this.props.price}</p>
                        <p><strong>Rent Price : </strong>{this.props.rentPrice}</p>
                        <p><strong>Rent Duration : </strong>{this.props.days}</p>

                        <div className="button-grp">
                            <button onClick={this.props.buyClick}>Buy</button>
                            <button onClick={this.props.rentClick}>Rent</button>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}
                                          
export default Card;