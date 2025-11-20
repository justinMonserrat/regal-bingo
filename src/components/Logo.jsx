import regalLogo from '../assets/regal_logo_orange.png'

function Logo({ size = 164 }) {
  return (
    <img
      src={regalLogo}
      alt="Regal Bingo"
      width={size}
      height={size * 0.32}
      className="regal-logo"
    />
  )
}

export default Logo

