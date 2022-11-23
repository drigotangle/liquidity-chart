const express = require('express')
const bodyParse = require('body-parser')
const ethers = require('ethers')
const cors = require('cors')

const json = bodyParse.json
const app = express();
const router = express.Router()
const provider = new ethers.providers.JsonRpcProvider(`https://eth-goerli.g.alchemy.com/v2/dyt7aJu0I5SExDy2IxOSORNpDYKnTRCU`)

app.use(json());
app.use(router);
const PORT = process.env.PORT || 5000
var server_host = process.env.YOUR_HOST || '0.0.0.0';
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://tangleswap.exchange',
    'https://frontend-ts-dapp.vercel.app',
    'https://tangleswap-api.herokuapp.com/',
    'https://backend.tangleswap.exchange/'
  ],
};

const poolABI = [
  `function snapshotCumulativesInside(
  int24 tickLower,
  int24 tickUppers
) external 
  view 
  override 
  noDelegateCall 
  returns 
  (int56 tickCumulativeInside, 
  uint160 secondsPerLiquidityInsideX128, 
  uint32 secondsInside)`,
  `  function slot0(
    ) external view returns
    (uint160 sqrtPriceX96,
    int24 tick,
    uint16 observationIndex,
    uint16 observationCardinality,
    uint16 observationCardinalityNext,
    uint8 feeProtocol,
    bool unlocked)`,
    `  function ticks(
      int24 tick
    ) external 
    view 
    returns 
    (uint128 liquidityGross, 
      int128 liquidityNet, 
      uint256 feeGrowthOutside0X128, 
      uint256 feeGrowthOutside1X128, 
      int56 tickCumulativeOutside, 
      uint160 secondsPerLiquidityOutsideX128, 
      uint32 secondsOutside, 
      bool initialized)`,
      `function getTickAtSqrtRatio(
        uint160 sqrtPriceX96
      ) internal pure returns (int24 tick)`,
      `  function tickSpacing(
        ) external view returns (int24)`,
      `  function maxLiquidityPerTick(
        ) external view returns (uint128)`
]



app.listen(PORT, server_host, () => {
    console.log(`server is listening on port: ${PORT}`)
})

router.get('/chart/:pool', cors(corsOptions), async (req, res) => {
    const poolAddress = req.params.pool
    const pool = new ethers.Contract(poolAddress, poolABI, provider)
    
     const tickToPrice = (tick) => {
      const result = 1.0001 ** tick
      return result
    }

    const { sqrtPriceX96 } = await pool.slot0()
    const tickSpacing = await pool.tickSpacing()

    const maxTick = 887220
    const priceRoof = Number(sqrtPriceX96._hex) + (Number(sqrtPriceX96._hex) * 1.5)

    let data = []
        for(let i = maxTick; i > Number(tickSpacing) * 100; i -= Number(tickSpacing) * 100){
          if(tickToPrice(i) < priceRoof || i === maxTick && i % 60 === 0){
          try {
            const result = await pool.ticks(i)
            const allRange = await pool.ticks(887220)
            console.log(Number(allRange.liquidityGross._hex), 'allRange')
            data.push({
              price: tickToPrice(i),
              liquidity: i === maxTick ? Number(result.liquidityGross._hex) : Number(result.liquidityGross._hex) + Number(allRange.liquidityGross._hex)
            })}      
           catch (error) {
            return error.message
          }}
        }
        return res.json(data)
})