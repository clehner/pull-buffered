module.exports = function () {
  var _read
  var nextBuf, _nextBuf
  var ended
  var readLine

  function readData(end, cb) {
    if (ended)
      cb(ended)
    else if (nextBuf)
      cb(end, _nextBuf = nextBuf, nextBuf = null, _nextBuf)
    else
      _read(end, cb)
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
        _read(null, next)
      }
    }

    return function readLine(abort, cb) {
      if (ended) return cb(ended)
      _cb = cb
      readData(abort, next)
    }
  }

  function lines(abort, cb) {
    (readLine || (readLine = delimited('\n')))(abort, cb)
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
        _read(null, next)
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

  function sink(read) {
    _read = read
  }

  sink.passthrough = readData
  sink.lines = lines
  sink.delimited = delimited
  sink.chunks = chunks
  sink.take = take

  return sink
}
