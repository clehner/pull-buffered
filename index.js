module.exports = function (read) {
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

  function delimited(chr) {
    var _cb
    var line = ''

    function next(end, buf) {
      var _line, i
      if ((ended = end) === true && line)
        _cb(null, _line = line, line = '', _line)
      else if (end)
        _cb(end)
      else if (~(i = buf.indexOf(chr))) {
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

  function lines() {
    return delimited('\n')
  }

  function chunks(len) {
    var _cb
    var chunks = []
    var remaining = len

    function next(end, buf) {
      var _line, i
      if (ended = end) {
        _cb(end)
      } else if (buf.length >= remaining) {
        nextBuf = buf.slice(remaining)
        chunks.push(buf.slice(0, remaining))
        var data = Buffer.isBuffer(chunks[0]) ?
          Buffer.concat(chunks, len) :
          chunks.join('')
        chunks.length = null
        remaining = len
        _cb(null, data)
      } else {
        chunks.push(buf)
        remaining -= buf.length
        read(null, next)
      }
    }

    return function readChunk(abort, cb) {
      if (ended) return cb(ended)
      _cb = cb
      readData(abort, next)
    }
  }

  function take(len) {
    var remaining = len
    return function readChunk(abort, cb) {
      if (ended || !remaining) return cb(ended || true)
      readData(abort, function next(end, buf) {
        var _line, i
        if (ended = end) {
          cb(end)
        } else if (buf.length >= remaining) {
          var _remaining = remaining
          remaining = 0
          nextBuf = buf.slice(_remaining)
          cb(null, buf.slice(0, _remaining))
        } else {
          remaining -= buf.length
          cb(null, buf)
        }
      })
    }
  }

  readData.lines = lines
  readData.delimited = delimited
  readData.chunks = chunks
  readData.take = take
  return readData
}
