module.exports = function (read) {
  var line = ''
  var nextBuf, _nextBuf
  var ended

  function readData(end, cb) {
    if (ended)
      cb(ended)
    else if (nextBuf)
      cb(end, _nextBuf = nextBuf, nextBuf = null, _nextBuf)
    else
      read(end, cb)
  }

  function lines() {
    var _cb

    function next(end, buf) {
      var _line, i
      if ((ended = end) === true && line)
        _cb(null, _line = line, line = '', _line)
      else if (end)
        _cb(end)
      else if (~(i = buf.indexOf('\n'))) {
        if (i + 1 < buf.length)
          nextBuf = buf.slice(i + 1)
        var chunk = Buffer.isBuffer(buf)
          ? buf.toString('ascii', 0, i)
          : buf.slice(0, i)
        _cb(null, _line = line + chunk, line = '', _line)
      } else {
        line += buf.toString('ascii')
        read(null, next)
      }
    }

    return function readLine(abort, cb) {
      if (ended) return cb(ended)
      _cb = cb
      readData(abort, next)
    }
  }

  readData.lines = lines
  return readData
}
