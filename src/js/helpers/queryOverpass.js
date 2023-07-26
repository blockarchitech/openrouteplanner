export default function queryOverpass(q) {
  return new Promise(function (resolve, reject) {
    var baseUrl = "http://overpass-api.de/api/interpreter";
    var query = function (query) {
      var url = baseUrl + "?data=" + encodeURIComponent(query);
      return fetch(url).then(function (response) {
        if (!response.ok) {
          reject(response);
          throw new Error(
            "HTTP error " + response.status + " " + response.statusText
          );
        }
        return response.json();
      });
    };
    resolve(query(q));
  });
}
