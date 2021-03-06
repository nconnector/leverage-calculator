
// whole form
let form = document.getElementById('form')
//inputs
let inputPrice = document.getElementById('input__price')
let inputLeverage = document.getElementById('input__leverage')
let inputPositionCost = document.getElementById('input__position__cost')
let inputTargetPrice1 = document.getElementById('input__target1')
let inputTargetPrice2 = document.getElementById('input__target2')
// outputs
let outputQty = document.getElementById('output__quantity')
let outputPositionCost = document.getElementById('output__position__cost')
let outputPositionLeveraged = document.getElementById('output__position__leveraged')
let outputLiquidationPercentage = document.getElementById('output__liquidation__percentage')
let outputLiquidationPriceHalf = document.getElementById('output__liquidation__price__half')
let outputLiquidationPrice = document.getElementById('output__liquidation__price')
let outputTargetProfit1 = document.getElementById('output__profit__target1')
let outputTargetProfit2 = document.getElementById('output__profit__target2')

function calculate (e) {
    let long = true
    let price = parseFloat(inputPrice.value)
    let positionCost = parseFloat(inputPositionCost.value)
    let leverage = parseInt(inputLeverage.value)
    let qty = 0
    let target1 = parseFloat(inputTargetPrice1.value)
    let target2 = parseFloat(inputTargetPrice2.value)
    let commissionRate = 0.01 // TODO

    let positionLeveraged = 0.00
    let liquidationPercentage = 1.00 / leverage * 100 // TODO: -maintenance margin required
    let liquidationPriceHalf
    let liquidationPrice
    let targetProfit1
    let targetProfit2

    if (qty && !positionCost) {
        // if QTY is provided
        positionCost = price * qty / leverage
        positionLeveraged = price * qty
        console.log('QTY provided, price not')
    } else if (!qty && positionCost) {
        // if PositionCost is provided
        positionLeveraged = positionCost * leverage
        qty = positionLeveraged / price
        console.log('price provided, QTY not')
    } else {
        // raise error if both
        console.warn(`error in positionCost and QTY inputs\npositionCost: ${positionCost}\nQTY: ${qty}`)}
    
    if (long) { // long position
        liquidationPriceHalf = price * ( 1.00 - liquidationPercentage/2 )
        liquidationPrice = price * ( 1.00 - liquidationPercentage )
        targetProfit1 = (target1 - price) * qty * ( 1.00 - commissionRate )
        targetProfit2 = (target2 - price) * qty * ( 1.00 - commissionRate )
    } else { // short position
        liquidationPriceHalf = price * ( 1.00 + liquidationPercentage/2 )
        liquidationPrice = price * ( 1.00 + liquidationPercentage )
        targetProfit1 = (price - target1) * qty * ( 1.00 - commissionRate )
        targetProfit2 = (price - target2) * qty * ( 1.00 - commissionRate )
    }

    inputPositionCost.innerText = parseFloat(positionCost).toFixed(2)+"$"
    outputQty.innerText = qty > 0.0001 ? parseFloat(qty).toFixed(2) : parseFloat(qty).toFixed(8)
    outputPositionLeveraged.innerText = parseFloat(positionLeveraged).toFixed(2)+"$"
    outputLiquidationPercentage.innerText = parseFloat(-1*liquidationPercentage).toFixed(2)+"%"
    outputLiquidationPriceHalf.innerText = parseFloat(liquidationPriceHalf).toFixed(2)+"$"
    outputLiquidationPrice.innerText = parseFloat(liquidationPrice).toFixed(2)+"$"
    outputTargetProfit1.innerText = parseFloat(targetProfit1).toFixed(2)+"$"
    outputTargetProfit2.innerText = parseFloat(targetProfit2).toFixed(2)+"$"

    // set cookies
    let cookies = {
        'price': price,
        'positionCost': positionCost,
        'leverage': leverage,
        'target1': target1,
        'target2': target2 
    }
    setCookies(cookies)
    
    // prevernt page reload
    if (e) { e.preventDefault() }
}


// COOKIES

function setCookies(cookies) {
    // expiry in 30 days
    let expiry = new Date(new Date().getTime()+30*24*3600*1000)
        .toGMTString() 
    document.cookie = `formdata=${JSON.stringify(cookies)}; expires=${expiry}`
}

function getCookies() {
    let cookies = document.cookie.match(new RegExp('formdata' + '=([^;]+)'));
    cookies && (cookies = JSON.parse(cookies[1]))
    if (cookies) {
        inputPrice.value = cookies['price']
        inputPositionCost.value = cookies['positionCost']
        inputLeverage.value = cookies['leverage']
        inputTargetPrice1.value = cookies['target1']
        inputTargetPrice2.value = cookies['target2']
    }
}


// ONLOAD

getCookies()
calculate()


// add listeners

form.addEventListener('submit', calculate)
for (inp of form.elements) {
    inp.addEventListener('input', calculate)
}