pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

contract ContentShare {

    struct FileMap {
        uint timestamp;
        address owner;
        string contentName;
        string ownerName;
        uint priceBuy;
        uint priceRent;
        uint rentDays;
        string image;
        string[][] comments;
        uint totalBought;
        uint totalRented;
        uint totalPositive;
        uint totalNegative;
        uint earnings;
    }

    struct Customer {
        uint balance;
        string[][] booksBought;
        string[][] booksRent;
        string[] uploadHash;
        mapping (string => rentAgreement) rentDetails;
    }

    struct rentAgreement {
        uint boughtOn;
        uint validFor;
    }

    struct totalBought {
        uint total;
        uint totalBought;
        uint totalRented;
        uint totalEarnings;
    }

    struct totalScore {
        uint score;
    }

    event FileLogStatus(uint timestamp, address owner, string ipfsHash);
    event BookPurchase(uint customerBalance, uint ownerBalance);
    event TokenPurchase(uint customerBalance, address tokenBuyer);

    string[] public hashValues;
    string[] public authors;
    string[] public bookNames;
    string[] public prices;
    string[][] public bookDetails;

    mapping (string => totalScore) total;
    mapping (string => FileMap) allFiles;
    mapping (address => Customer) customerDetails;
    mapping (address => totalBought) bookStats;

    function uploadContent(string memory ipfsHash, string memory contentName,
                                string memory ownerName, uint price, uint rentPrice, uint rentDays, string memory image) public {
        Customer storage customer = customerDetails[msg.sender];
        
        if(allFiles[ipfsHash].timestamp == 0)
        {
            allFiles[ipfsHash].timestamp = block.timestamp;
            allFiles[ipfsHash].owner = msg.sender;
            allFiles[ipfsHash].contentName = contentName;
            allFiles[ipfsHash].ownerName = ownerName;
            allFiles[ipfsHash].priceBuy = price;
            allFiles[ipfsHash].priceRent = rentPrice;
            allFiles[ipfsHash].rentDays = rentDays;
            allFiles[ipfsHash].image = image;

            customer.uploadHash.push(ipfsHash);
            hashValues.push(ipfsHash)-1;
            bookDetails.push([ownerName, contentName, uint2str(price), ipfsHash, image, uint2str(rentPrice), uint2str(rentDays)]);
    
            emit FileLogStatus(block.timestamp, msg.sender, ipfsHash);
        }
        else
        {
            emit FileLogStatus(block.timestamp, msg.sender, ipfsHash);
        }
    }

    function searchName(string memory fileHash) public view returns (string memory contentName) {
        
        return (allFiles[fileHash].contentName);
    }
    
    function getUploads(address custAddress) public view returns (uint total, uint earnings, uint totalBought, uint totalRented) {
        
        return(bookStats[custAddress].total, bookStats[custAddress].totalEarnings, bookStats[custAddress].totalBought, 
                                            bookStats[custAddress].totalRented);
    }
    
    function purchase(string memory fileHash) public {

        address owner = allFiles[fileHash].owner;
        uint unitPrice = allFiles[fileHash].priceBuy;
        uint custBalance;
        uint ownerBalance;

        Customer storage author = customerDetails[owner];
        Customer storage customer = customerDetails[msg.sender];
        
        require(customer.balance >= unitPrice, "Low Wallet Balance");
        custBalance = customer.balance - unitPrice;
        ownerBalance = author.balance + unitPrice;
        
        author.balance = ownerBalance;
        customer.balance = custBalance;
        
        bookStats[owner].total = bookStats[owner].total + 1;
        bookStats[owner].totalEarnings = bookStats[owner].totalEarnings + unitPrice;
        bookStats[owner].totalBought = bookStats[owner].totalBought + 1;

        allFiles[fileHash].earnings = allFiles[fileHash].earnings + unitPrice;
        allFiles[fileHash].totalBought = allFiles[fileHash].totalBought + 1;
        
        customer.booksBought.push([fileHash, allFiles[fileHash].contentName, allFiles[fileHash].image]) -1;
        emit BookPurchase(customer.balance, author.balance);
    }
    
    function rentTransaction(string memory fileHash) public {
        
        uint currentTime = block.timestamp;
        address owner = allFiles[fileHash].owner;
        uint rentDays = allFiles[fileHash].rentDays;
        uint finalTime = currentTime + rentDays * 1 days;
        uint rentPrice = allFiles[fileHash].priceRent;
        uint custBalance;
        uint ownerBalance;
        
        Customer storage author = customerDetails[owner];
        Customer storage customer = customerDetails[msg.sender];
        
        require(customer.balance >= rentPrice, "Low Wallet Balance");
        custBalance = customer.balance - rentPrice;
        ownerBalance = author.balance + rentPrice;
        
        author.balance = ownerBalance;
        customer.balance = custBalance;
        
        customer.booksRent.push([fileHash, allFiles[fileHash].contentName, allFiles[fileHash].image]) -1;
        customer.rentDetails[fileHash] = rentAgreement(currentTime, finalTime);

        allFiles[fileHash].totalRented = allFiles[fileHash].totalRented + 1;
        allFiles[fileHash].earnings = allFiles[fileHash].earnings + rentPrice;
        
        bookStats[owner].total = bookStats[owner].total + 1;
        bookStats[owner].totalRented = bookStats[owner].totalRented + 1;
        bookStats[owner].totalEarnings = bookStats[owner].totalEarnings + rentPrice;
    }
    
    function getRentUpdate(string memory fileHash) public view returns (bool) {
        
        Customer storage customer = customerDetails[msg.sender];
        if(now == customer.rentDetails[fileHash].validFor) {
            return false;
        }
        else {
            return true;
        }
    }
    
    function buyTokens(uint tokens) public {

        customerDetails[msg.sender].balance += tokens;
    }
    
    function getCustomer(address custAddress) public view returns (uint customerBalance, string[][] memory boughtBooks, string[][] memory rentBooks) {
        return (customerDetails[custAddress].balance, customerDetails[custAddress].booksBought, customerDetails[custAddress].booksRent);
    }
    
    function getBooks(string memory bookName) public view returns (string memory) {
        for(uint i=0; i<=hashValues.length; i++) {
            string memory name = allFiles[hashValues[i]].contentName;
            if(compareStrings(name, bookName)){
                return (hashValues[i]);
            } 
        }
    }
    
    function getAllBooks() public view returns (string[][] memory) {
        return(bookDetails);
    }
    
    function allowComment(string memory ipfsHash) public view returns (bool) {
        Customer memory customer = customerDetails[msg.sender];
        
        for(uint i =0; i< customer.booksBought.length; i++) {
            if(compareStrings(ipfsHash, customer.booksBought[i][0])) {
                return true;
            }
        }
    }
    
    function addComment(string memory comment, string memory ipfsHash, uint sentiment, bool negative) public {
        FileMap storage files = allFiles[ipfsHash];
        require(allowComment(ipfsHash));
        string memory value = negative ? "true" : "false";
        negative ? total[ipfsHash].score = total[ipfsHash].score - sentiment : 
                            total[ipfsHash].score  = total[ipfsHash].score + sentiment; 
        negative ? allFiles[ipfsHash].totalNegative = allFiles[ipfsHash].totalNegative +1 : 
                                        allFiles[ipfsHash].totalPositive = allFiles[ipfsHash].totalPositive +1;
        files.comments.push([comment, uint2str(sentiment), value]);
    }
    
    function getComments(string memory ipfsHash) public view returns (string[][] memory comment) {
        return(allFiles[ipfsHash].comments);
    }
    
    function getTotalComments(string memory ipfsHash) public view returns (uint) {
        return(allFiles[ipfsHash].comments.length);
    }
    
    function getTotalScore() public view returns (uint[] memory) {
        uint[] memory totalScoreArray = new uint[](hashValues.length);
        for(uint i=0; i< hashValues.length; i++) {
            totalScoreArray[i] = total[hashValues[i]].score;
        }
        return totalScoreArray;
    }
    
    function getBookTotal(string memory ipfsHash) public view returns (uint totalBoughtBooks) {
        
        Customer storage customer = customerDetails[msg.sender];
        for(uint i=0; i<= customer.uploadHash.length; i++) {
            if(compareStrings(customer.uploadHash[i],ipfsHash)) {
                return totalBoughtBooks;
            }
        }
    }
    
    function getBooksInsight(address custAddress) public view returns(string[][] memory) {
       
        Customer storage customer = customerDetails[custAddress];
        string[][] memory books = new string[][](customer.uploadHash.length);

        for(uint i=0; i< customer.uploadHash.length; i++) {
            books[i] = new string[](9);
            books[i][0] = allFiles[customer.uploadHash[i]].contentName;    
            books[i][1] = allFiles[customer.uploadHash[i]].image;
            books[i][2] = uint2str(allFiles[customer.uploadHash[i]].totalBought);
            books[i][3] = uint2str(allFiles[customer.uploadHash[i]].totalRented);
            books[i][4] = uint2str(allFiles[customer.uploadHash[i]].earnings);
            books[i][5] = uint2str(allFiles[customer.uploadHash[i]].totalNegative);
            books[i][6] = uint2str(allFiles[customer.uploadHash[i]].totalPositive);
            books[i][7] = uint2str(total[customer.uploadHash[i]].score);
            books[i][8] = customer.uploadHash[i];
        }
        return books;
    }   
    
    function uint2str(uint _i) public view returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len - 1;
        while (_i != 0) {
            bstr[k--] = byte(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }
    
    function compareStrings (string memory a, string memory b) public view returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))) );
    }
    
 }
