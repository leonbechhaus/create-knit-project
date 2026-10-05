// AUTO-GENERATED from the scraped/vectorized knitting-symbol set — see
// src/assets/stitch-symbols/ for the source SVGs. Regenerate by re-running
// the extraction pipeline rather than hand-editing this list.

import bindOffIcon from '../assets/stitch-symbols/bind-off.svg'
import castOnIcon from '../assets/stitch-symbols/cast-on.svg'
import centeredDoubleDecreaseIcon from '../assets/stitch-symbols/centered-double-decrease.svg'
import centeredDoubleDecreasePurlwiseIcon from '../assets/stitch-symbols/centered-double-decrease-purlwise.svg'
import knitIcon from '../assets/stitch-symbols/knit.svg'
import knit4TogetherIcon from '../assets/stitch-symbols/knit-4-together.svg'
import knit5TogetherIcon from '../assets/stitch-symbols/knit-5-together.svg'
import knit6TogetherIcon from '../assets/stitch-symbols/knit-6-together.svg'
import knit7TogetherIcon from '../assets/stitch-symbols/knit-7-together.svg'
import knitThreeStitchesTogetherIcon from '../assets/stitch-symbols/knit-three-stitches-together.svg'
import knitThroughTheBackLoopIcon from '../assets/stitch-symbols/knit-through-the-back-loop.svg'
import knitTwoStitchesTogetherIcon from '../assets/stitch-symbols/knit-two-stitches-together.svg'
import kyokIcon from '../assets/stitch-symbols/kyok.svg'
import moveMarkerLeftIcon from '../assets/stitch-symbols/move-marker-left.svg'
import moveMarkerRightIcon from '../assets/stitch-symbols/move-marker-right.svg'
import placeMarkerIcon from '../assets/stitch-symbols/place-marker.svg'
import purlIcon from '../assets/stitch-symbols/purl.svg'
import purlThreeStitchesTogetherIcon from '../assets/stitch-symbols/purl-three-stitches-together.svg'
import purlThroughTheBackLoopIcon from '../assets/stitch-symbols/purl-through-the-back-loop.svg'
import purlTwoStitchesTogetherIcon from '../assets/stitch-symbols/purl-two-stitches-together.svg'
import pyopIcon from '../assets/stitch-symbols/pyop.svg'
import shortRowLeftIcon from '../assets/stitch-symbols/short-row-left.svg'
import shortRowRightIcon from '../assets/stitch-symbols/short-row-right.svg'
import slipMarkerIcon from '../assets/stitch-symbols/slip-marker.svg'
import slipSlipKnitIcon from '../assets/stitch-symbols/slip-slip-knit.svg'
import slipSlipPurlIcon from '../assets/stitch-symbols/slip-slip-purl.svg'
import slipSlipSlipKnitSk2pIcon from '../assets/stitch-symbols/slip-slip-slip-knit-sk2p.svg'
import slipSlipSlipPurlIcon from '../assets/stitch-symbols/slip-slip-slip-purl.svg'
import twistedKnitTwoStitchesTogetherIcon from '../assets/stitch-symbols/twisted-knit-two-stitches-together.svg'
import twistedSlipSlipKnitIcon from '../assets/stitch-symbols/twisted-slip-slip-knit.svg'
import yarnOverIcon from '../assets/stitch-symbols/yarn-over.svg'
import yarnOverFiveTimesIcon from '../assets/stitch-symbols/yarn-over-five-times.svg'
import yarnOverFourTimesIcon from '../assets/stitch-symbols/yarn-over-four-times.svg'
import yarnOverSixTimesIcon from '../assets/stitch-symbols/yarn-over-six-times.svg'
import yarnOverThreeTimesIcon from '../assets/stitch-symbols/yarn-over-three-times.svg'
import yarnOverTwiceIcon from '../assets/stitch-symbols/yarn-over-twice.svg'

/** One selectable knitting-chart symbol: a stable id, a human label, a short
 *  plain-language meaning (shown in the legend modal), and its SVG source URL. */
export type StitchSymbol = {
  id: string
  label: string
  description: string
  src: string
}

export const STITCH_SYMBOLS: StitchSymbol[] = [
  {
    id: 'bind-off',
    label: 'Bind off',
    description: 'Pass one stitch over another to close off and finish the edge.',
    src: bindOffIcon,
  },
  {
    id: 'cast-on',
    label: 'Cast on',
    description: 'Create the foundation row of stitches to begin knitting.',
    src: castOnIcon,
  },
  {
    id: 'centered-double-decrease',
    label: 'Centered Double Decrease',
    description:
      'Slip two stitches together knitwise, knit one, pass the slipped stitches over — decreases 2 stitches with the center one on top.',
    src: centeredDoubleDecreaseIcon,
  },
  {
    id: 'centered-double-decrease-purlwise',
    label: 'Centered Double Decrease Purlwise',
    description: 'The centered double decrease worked from the purl side of the fabric.',
    src: centeredDoubleDecreasePurlwiseIcon,
  },
  {
    id: 'knit',
    label: 'Knit',
    description: 'A standard knit stitch, worked through the front loop.',
    src: knitIcon,
  },
  {
    id: 'knit-4-together',
    label: 'Knit 4 together',
    description: 'Knit four stitches together as one, decreasing by 3 stitches.',
    src: knit4TogetherIcon,
  },
  {
    id: 'knit-5-together',
    label: 'Knit 5 together',
    description: 'Knit five stitches together as one, decreasing by 4 stitches.',
    src: knit5TogetherIcon,
  },
  {
    id: 'knit-6-together',
    label: 'Knit 6 together',
    description: 'Knit six stitches together as one, decreasing by 5 stitches.',
    src: knit6TogetherIcon,
  },
  {
    id: 'knit-7-together',
    label: 'Knit 7 together',
    description: 'Knit seven stitches together as one, decreasing by 6 stitches.',
    src: knit7TogetherIcon,
  },
  {
    id: 'knit-three-stitches-together',
    label: 'Knit three stitches together',
    description: 'Knit three stitches together as one, decreasing by 2 stitches.',
    src: knitThreeStitchesTogetherIcon,
  },
  {
    id: 'knit-through-the-back-loop',
    label: 'Knit through the back loop',
    description: 'Knit into the back loop of the stitch instead of the front, twisting it.',
    src: knitThroughTheBackLoopIcon,
  },
  {
    id: 'knit-two-stitches-together',
    label: 'Knit two stitches together',
    description: 'Knit two stitches together as one, decreasing by 1 stitch; slants right.',
    src: knitTwoStitchesTogetherIcon,
  },
  {
    id: 'kyok',
    label: 'Kyok',
    description: '"Knit, yarn over, knit" into the same stitch — increases by 2 stitches from one.',
    src: kyokIcon,
  },
  {
    id: 'move-marker-left',
    label: 'Move marker left',
    description: 'Move the stitch marker one position to the left.',
    src: moveMarkerLeftIcon,
  },
  {
    id: 'move-marker-right',
    label: 'Move marker right',
    description: 'Move the stitch marker one position to the right.',
    src: moveMarkerRightIcon,
  },
  {
    id: 'place-marker',
    label: 'Place marker',
    description: 'Place a stitch marker at this point in the row.',
    src: placeMarkerIcon,
  },
  {
    id: 'purl',
    label: 'Purl',
    description: 'A standard purl stitch, worked through the front loop.',
    src: purlIcon,
  },
  {
    id: 'purl-three-stitches-together',
    label: 'Purl three stitches together',
    description: 'Purl three stitches together as one, decreasing by 2 stitches.',
    src: purlThreeStitchesTogetherIcon,
  },
  {
    id: 'purl-through-the-back-loop',
    label: 'Purl through the back loop',
    description: 'Purl into the back loop of the stitch instead of the front, twisting it.',
    src: purlThroughTheBackLoopIcon,
  },
  {
    id: 'purl-two-stitches-together',
    label: 'Purl two stitches together',
    description: 'Purl two stitches together as one, decreasing by 1 stitch.',
    src: purlTwoStitchesTogetherIcon,
  },
  {
    id: 'pyop',
    label: 'Pyop',
    description: '"Purl, yarn over, purl" into the same stitch — increases by 2 stitches from one.',
    src: pyopIcon,
  },
  {
    id: 'short-row-left',
    label: 'Short row left',
    description: 'A short-row turn, wrapping the stitch and leaving stitches unworked to the left.',
    src: shortRowLeftIcon,
  },
  {
    id: 'short-row-right',
    label: 'Short row right',
    description:
      'A short-row turn, wrapping the stitch and leaving stitches unworked to the right.',
    src: shortRowRightIcon,
  },
  {
    id: 'slip-marker',
    label: 'Slip marker',
    description: 'Slip the stitch marker from the left needle to the right without working it.',
    src: slipMarkerIcon,
  },
  {
    id: 'slip-slip-knit',
    label: 'Slip slip knit',
    description:
      'Slip two stitches knitwise, then knit them together through the back loop — decreases by 1, slants left.',
    src: slipSlipKnitIcon,
  },
  {
    id: 'slip-slip-purl',
    label: 'Slip slip purl',
    description:
      'Slip two stitches knitwise, then purl them together through the back loop — decreases by 1, slants left on the purl side.',
    src: slipSlipPurlIcon,
  },
  {
    id: 'slip-slip-slip-knit-sk2p',
    label: 'Slip slip slip knit / Sk2p',
    description:
      'Slip three stitches knitwise, then knit them together through the back loop — decreases by 2.',
    src: slipSlipSlipKnitSk2pIcon,
  },
  {
    id: 'slip-slip-slip-purl',
    label: 'Slip slip slip purl',
    description:
      'Slip three stitches knitwise, then purl them together through the back loop — decreases by 2.',
    src: slipSlipSlipPurlIcon,
  },
  {
    id: 'twisted-knit-two-stitches-together',
    label: 'Twisted knit two stitches together',
    description: 'Knit two stitches together through the back loop, twisting the decrease.',
    src: twistedKnitTwoStitchesTogetherIcon,
  },
  {
    id: 'twisted-slip-slip-knit',
    label: 'Twisted slip slip knit',
    description:
      'A twisted variant of slip-slip-knit, worked through the back loop for a tighter decrease.',
    src: twistedSlipSlipKnitIcon,
  },
  {
    id: 'yarn-over',
    label: 'Yarn over',
    description:
      'Wrap the yarn over the needle before the next stitch — creates an eyelet and adds 1 stitch.',
    src: yarnOverIcon,
  },
  {
    id: 'yarn-over-five-times',
    label: 'Yarn over five times',
    description:
      'Wrap the yarn over the needle five times, creating multiple loops for an elongated stitch.',
    src: yarnOverFiveTimesIcon,
  },
  {
    id: 'yarn-over-four-times',
    label: 'Yarn over four times',
    description:
      'Wrap the yarn over the needle four times, creating multiple loops for an elongated stitch.',
    src: yarnOverFourTimesIcon,
  },
  {
    id: 'yarn-over-six-times',
    label: 'Yarn over six times',
    description:
      'Wrap the yarn over the needle six times, creating multiple loops for an elongated stitch.',
    src: yarnOverSixTimesIcon,
  },
  {
    id: 'yarn-over-three-times',
    label: 'Yarn over three times',
    description:
      'Wrap the yarn over the needle three times, creating multiple loops for an elongated stitch.',
    src: yarnOverThreeTimesIcon,
  },
  {
    id: 'yarn-over-twice',
    label: 'Yarn over twice',
    description:
      'Wrap the yarn over the needle twice, creating multiple loops for an elongated stitch.',
    src: yarnOverTwiceIcon,
  },
]

export const getStitchSymbol = (id: string): StitchSymbol | undefined =>
  STITCH_SYMBOLS.find((s) => s.id === id)
