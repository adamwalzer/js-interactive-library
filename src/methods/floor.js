var floor = (a, b) => {
  var c = b ? Math.pow(10, b) : 1;
  return Math.floor(a * c) / c;
};

export default floor;
