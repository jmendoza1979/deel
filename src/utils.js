//This function helps us to convert a date into a format like yyyy-mm-dd
//TODO: This needs more work since is not considering UTC (zones)
function dateToYMD(date) {
    var d = date.getDate();
    var m = date.getMonth() + 1; //Month from 0 to 11
    var y = date.getFullYear();
    return '' + y + '-' + (m<=9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
}

module.exports = {
    dateToYMD
}
