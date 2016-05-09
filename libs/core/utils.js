
module.exports = {
  getDelimiter: getDelimiter, // Handle auto delimiter: return explicitely specified delimiter or try auto detect
  rowSplit: rowSplit, //Split a csv row to an array based on delimiter and quote
  isToogleQuote: isToogleQuote, //returns if a segmenthas even number of quotes
  twoDoubleQuote: twoDoubleQuote //converts two double quotes to one
}
var cachedRegExp = {};
var defaulDelimiters=[",","|","\t",";",":"];
function getDelimiter(rowStr,param) {
  var checker;
  if (param.delimiter==="auto"){
    checker=defaulDelimiters;
  }else if (param.delimiter instanceof Array){
    checker=param.delimiter;
  }else{
    return param.delimiter;
  }
  var count=0;
  var rtn=",";
  checker.forEach(function(delim){
    var delimCount=rowStr.split(delim).length;
    if (delimCount>count){
      rtn=delim;
      count=delimCount;
    }
  });
  return rtn;
}

function rowSplit(rowStr, param) {
  var quote=param.quote;
  var trim=param.trim;
  if (param.needCheckDelimiter===true){
      param.delimiter=getDelimiter(rowStr,param);
      param.needCheckDelimiter=false;
  }
  var delimiter=param.delimiter;
  var rowArr = rowStr.split(delimiter);
  var row = [];
  var inquote = false;
  var quoteBuff = '';
  for (var i=0;i<rowArr.length;i++){
    var e=rowArr[i];
    if (!inquote && trim){
      e=e.trim();
    }
    var len=e.length;
    if (!inquote){
      if (e[0] === quote){ //possible open
          e=e.substr(1);
          len-=1;
          if (e[0]!==quote){ // open quote
              if (e[len-1] === quote){ // possible close
                  if (e[len-2]!==quote){ // close quote
                    e=e.substring(0,len-1);
                    e=twoDoubleQuote(e,quote);
                    row.push(e);
                    continue;
                  }
              }
              inquote=true;
              quoteBuff+=e;
              continue;
          }else{
            if (len ===1){ // original column is empty quote pairs like ""
              e="";
            }
            row.push(e);
            continue;
          }
      }else{
          row.push(e);
          continue;
      }
    }else{ //previous quote not closed
      if (e[len-1] === quote && e[len-2] !==quote){ //close double quote
        inquote=false;
        e=e.substr(0,len-1);
        quoteBuff+=delimiter+e;
        quoteBuf=twoDoubleQuote(quoteBuff,quote);
        if (trim){
          quoteBuff=quoteBuff.trimRight();
        }
        row.push(quoteBuff);
        quoteBuff="";
      }else{
        quoteBuff+=delimiter+e;
      }
    }


    // if (isToogleQuote(e, quote)) { //if current col has odd quotes, switch quote status
    //   if (inquote) { //if currently in open quote status, close it and output data
    //     quoteBuff += delimiter;
    //     quoteBuff += twoDoubleQuote(e.substr(0, e.length - 1), quote);
    //     row.push(trim ? quoteBuff.trim() : quoteBuff);
    //     quoteBuff = '';
    //   } else { // currently not in open quote status, open it
    //     quoteBuff += twoDoubleQuote(e.substring(1), quote);
    //   }
    //   inquote = !inquote;
    // } else if (inquote) { // if current col has even quotes, do not switch quote status
    //   //if current status is in quote, add to buffer wait to close
    //   quoteBuff += delimiter + twoDoubleQuote(e, quote);
    // } else { // if current status is not in quote, out put data
    //   if (trim) {
    //     e = e.trim();
    //   }
    //   if (e.indexOf(quote) === 0 && e[e.length - 1] === quote) { //if current col contain full quote segment,remove quote first
    //     e = e.substring(1, e.length - 1);
    //   }
    //   row.push(twoDoubleQuote(e, quote));
    // }
  }
  return row;
}

function _getRegExpObj(quote) {
  if (cachedRegExp[quote]) {
    return cachedRegExp[quote];
  } else {
    cachedRegExp[quote] = {
      single: new RegExp(quote, 'g'),
      double: new RegExp(quote + quote, 'g')
    }
    return _getRegExpObj(quote);
  }
}

function isToogleQuote(segment, quote) {
  var reg = _getRegExpObj(quote).single;
  var match = segment.match(reg);
  return match && match.length % 2 !== 0;
}

function twoDoubleQuote(segment, quote) {
  var regExp = _getRegExpObj(quote).double;
  return segment.replace(regExp, quote);
}
