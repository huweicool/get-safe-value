
const {
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isFunction,
  isAsyncFunction,
} = require("./type");

const defaultUndefined = undefined;
const defaultString = "";
const defaultNumber = 0;
const defaultBoolean = false;
const defaultObject = {};
const defaultArray = [];
const defaultFunction = function() {};
const defaultAsyncFunction = async function() {};
const defaultGetVal = (value) => value;
const maxNumber = Math.pow(2, 53) - 1;
const minNumber = -(Math.pow(2, 53) - 1);
const reEscapeChar = /\\(\\)?/g;
const rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

// Gets the value of multiple nested objects
function getDeepValue(obj, keys) {
  let value = obj;
  const _keys = JSON.parse(JSON.stringify(keys));
  while ((isObject(value) || isArray(value)) && _keys.length > 0) {
    value = value[_keys[0]];
    _keys.shift();
  }
  return value;
}

// Key is a string of words (" array [0]. The name "), into the array keys ([" array ", "0", "name"])
function getKeys(key) {
  if( !isString(key) ) return key;
  if( isString(key) && !(/\.+/g.test(key)) ) return key;
  let keys = [];
  key.replace(rePropName, (match, number, quote, subString) => {
    const value = quote
      ? subString.replace(reEscapeChar, "$1")
      : number || match;
    keys.push(value);
  });
  return keys;
}

function getDefaultValue(key, defaultValue, isType) {
  let value = defaultValue;
  if (isString(defaultValue)) value = "''";
  if (isArray(defaultValue)) value = "[]";
  if (isObject(defaultValue)) value = "{}";
  const name = isType.name.replace(/(_is|is)/i, "get");
  console.warn(
    "Call " +
      name +
      " function returns the default:" +
      value +
      ", Please check that the data is correct. " + "key is: '" + key +"'"
  );
  return defaultValue;
}

function getValue(obj, key, defaultValue, isType, getVal = defaultGetVal) {
  if (!isObject(obj) && !isArray(obj)) return getDefaultValue(key, defaultValue, isType);
  const keys = getKeys(key);
  const value = isArray(keys) ? getDeepValue(obj, keys) : obj[keys];
  return isType(value) ? getVal(value) : getDefaultValue(key, defaultValue, isType);
}


function getString(obj, key, defaultValue = defaultString) {
  const _isString = (value) => isString(value) || isNumber(value) || isBoolean(value); //The basic data type can be converted to a String by calling the String constructor
  return getValue(obj, key, defaultValue, _isString, (value) => String(value));
}

function getNumber(obj, key, defaultValue = defaultNumber) {
  const _isNumber = (value) => {
    value = Number(value);
    return (
      isNumber(value) &&
      isFinite(value) &&
      value < maxNumber &&
      value > minNumber
    );
  };
  return getValue(obj, key, defaultValue, _isNumber, (value) => Number(value));
}

function getBoolean(obj, key, defaultValue = defaultBoolean) {
  const _isBoolean = (value) => {
    if (isString(value)) value = value.toLowerCase();
    return (
      isBoolean(value) ||
      value === 0 ||
      value === 1 ||
      value === "false" ||
      value === "true"
    );
  };
  return getValue(obj, key, defaultValue, _isBoolean, (value) => Boolean(value) );
}

function getObject(obj, key, defaultValue = defaultObject) {
  return getValue(obj, key, defaultValue, isObject);
}

function getArray(obj, key, defaultValue = defaultArray) {
  return getValue(obj, key, defaultValue, isArray);
}

function getFunction(obj, key, defaultValue = defaultFunction) {
  const _isFunction = (value) => isFunction(value) || isAsyncFunction(value);
  return getValue(obj, key, defaultValue, _isFunction);
}

function getAsyncFunction(obj, key, defaultValue = defaultAsyncFunction) {
  return getValue(obj, key, defaultValue, isAsyncFunction);
}

function getAny(obj, key) {
  return getValue(obj, key, defaultUndefined, () => true);
}

function getFn(type) {
  type = isString(type) ? type.toLowerCase() : "";
  const config = {
    string: getString,
    number: getNumber,
    boolean: getBoolean,
    object: getObject,
    array: getArray,
    function: getFunction,
  };
  return config.hasOwnProperty(type) ? config[type] : getString;
}

function getObjectBatch(obj, keys, defaultValue = defaultObject) {
  if (!isObject(obj)) return defaultValue;
  if (!isArray(keys)) return obj;
  keys.forEach((item) => {
    const [key, type, defaultValue] = [getString(item, 0), getString(item,1), getAny(item,2)];
    if (obj.hasOwnProperty(key)) {
      const fn = getFn(type);
      obj[key] = fn(obj, key, defaultValue);
    }
  });
  return obj;
}

function getArrayBatch(array, keys, defaultValue = defaultArray) {
  if (!isArray(array)) return defaultValue;
  if (!isArray(keys)) return array;
  array.forEach((item, i) => {
    array[i] = getObjectBatch(item, keys);
  });
  return array;
}


module.exports = {
  getAny,
  getString,
  getNumber,
  getBoolean,
  getObject,
  getArray,
  getFunction,
  getAsyncFunction,
  getObjectBatch,
  getArrayBatch,
}