var mergeObjects = function (data1, data2) {
  if (!data2) return data1;

  Object.keys(data2).map((key) => {
    if (data1[key]) {
      if (typeof data1[key] === 'object' && typeof data2[key] === 'object') {
        data1[key] = mergeObjects(data1[key], data2[key]);
      }
    } else {
      data1[key] = data2[key];
    }
  });

  return data1;
};

export default mergeObjects;
