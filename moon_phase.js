// This source code is in redistribution of a free software
// https://github.com/tingletech/moon-phase/blob/gh-pages/moon-phase.js
//
// Copyright © 2012, Regents of the University of California
// All rights reserved.
//
//   Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
// - Redistributions of source code must retain the above copyright notice,
//   this list of conditions and the following disclaimer.
// - Redistributions in binary form must reproduce the above copyright notice,
//   this list of conditions and the following disclaimer in the documentation
// and/or other materials provided with the distribution.
// - Neither the name of the University of California nor the names of its
// contributors may be used to endorse or promote products derived from this
// software without specific prior written permission.
//
//   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

// http://stackoverflow.com/questions/11759992/calculating-jdayjulian-day-in-javascript
// http://jsfiddle.net/gkyYJ/
// http://stackoverflow.com/users/965051/adeneo
// http://www.ben-daglish.net/moon.shtml
function moonPhase (today, tzOffset) {
  const getJulian = (date) => {
    return ((date / 86400000) - (tzOffset / 1440) + 2440587.5)
  }
  const getFrac = (fr) => {
    return fr - Math.floor(fr)
  }
  const thisJD = getJulian(today)
  const year = today.getFullYear()
  const degToRad = 3.14159265 / 180
  let oldJ
  const K0 = Math.floor((year - 1900) * 12.3685)
  const T = (year - 1899.5) / 100
  const T2 = T * T
  const T3 = T * T * T
  const J0 = 2415020 + 29 * K0
  const F0 = 0.0001178 * T2 - 0.000000155 * T3 + (0.75933 + 0.53058868 * K0) - (0.000837 * T + 0.000335 * T2)
  const M0 = 360 * (getFrac(K0 * 0.08084821133)) + 359.2242 - 0.0000333 * T2 - 0.00000347 * T3
  const M1 = 360 * (getFrac(K0 * 0.07171366128)) + 306.0253 + 0.0107306 * T2 + 0.00001236 * T3
  const B1 = 360 * (getFrac(K0 * 0.08519585128)) + 21.2964 - (0.0016528 * T2) - (0.00000239 * T3)
  let phase = 0
  let jday = 0
  while (jday < thisJD) {
    let F = F0 + 1.530588 * phase
    const M5 = (M0 + phase * 29.10535608) * degToRad
    const M6 = (M1 + phase * 385.81691806) * degToRad
    const B6 = (B1 + phase * 390.67050646) * degToRad
    F -= 0.4068 * Math.sin(M6) + (0.1734 - 0.000393 * T) * Math.sin(M5)
    F += 0.0161 * Math.sin(2 * M6) + 0.0104 * Math.sin(2 * B6)
    F -= 0.0074 * Math.sin(M5 - M6) - 0.0051 * Math.sin(M5 + M6)
    F += 0.0021 * Math.sin(2 * M5) + 0.0010 * Math.sin(2 * B6 - M6)
    F += 0.5 / 1440
    oldJ = jday
    jday = J0 + 28 * phase + Math.floor(F)
    phase++
  }

  // 29.53059 days per lunar month
  return (((thisJD - oldJ) / 29.53059))
}

function moonPhaseLevel (phase) {
  if (phase <= 0.0625 || phase > 0.9375) {
    return '0'
  } else if (phase <= 0.1875) {
    return '1'
  } else if (phase <= 0.3125) {
    return '2'
  } else if (phase <= 0.4375) {
    return '3'
  } else if (phase <= 0.5625) {
    return '4'
  } else if (phase <= 0.6875) {
    return '5'
  } else if (phase <= 0.8125) {
    return '6'
  } else if (phase <= 0.9375) {
    return '7'
  }
}

module.exports = {
  moonPhase,
  moonPhaseLevel
}
