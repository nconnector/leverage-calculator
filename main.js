let form = document.getElementById('form')
const groupWhite = document.querySelector(".group.white")
const groupRed = document.querySelector(".group.red")
const groupGreen = document.querySelector(".group.green")

class Variable {
    // HTML representation as .grid__item
    // value representation for calculations
    //
    // TODO:
    //     setter to move to another group?
    //     setter when type is changed
    //   ! setter when value is changed to adjust HTML
    
    constructor(label, type, group, value, format, min, max, step) {
        // label: 
        //    text displayed in HTML
        // id: 
        //    #id
        // type: 
        //    input, range, boolean, output
        // group:
        //    white, red, green
        // format:
        //    $, %, int

        this.label = label
        this.type = type
        this.group = group
        this.value = value
        this.format = format

        this.min = min
        this.max = max
        this.step = step

        this.id = label.replace(' ', '_').toLowerCase()
        this.htmlDiv = this.createDiv()
    }
    get valueStr() {
        switch(this.format) {
            case 'currency':
                return round(this.value, -2) + ' $'
            case 'percent':
                return round(this.value*-100, -1) + ' %'
            case 'qty':
                if (this.value == 0) {return 0}
                else if (this.value > 0.0001) {return round(this.value, -2)} 
                else {return round(this.value, -8)} 
            default:
                return this.value
        }
    }
    get v() {
        return this.value
    }
    set setVal(newValue) {
        this.value = newValue ? newValue : 0
        if (this.type === 'output') {
            this.htmlDiv.lastElementChild.innerText = this.valueStr
        } else {
            if (!latestInput || latestInput == this.htmlDiv.lastElementChild) {
                // this is the element currently being edited, value is kept
                this.htmlDiv.lastElementChild.value = this.value
            } else {
                // any other element, needs to be rounded
                this.htmlDiv.lastElementChild.value = this.value //todo: round inputs
            }
        }
    }

    createDiv() {
        let div = document.createElement('div')
        let labelField
        let valueField
        div.classList.add('grid__item', this.type)
        if (this.type === 'output') {
            labelField = document.createElement('span')
            labelField.innerText = this.label
            valueField = document.createElement('span')
            valueField.innerText = this.valueStr
            
        } else { // add range and switch
            labelField = document.createElement('label')
            labelField.setAttribute('for', this.id)
            labelField.innerText = this.label
            valueField = document.createElement('input')
            valueField.id = this.id
            valueField.type = 'number'
            valueField.value = this.value
            if (this.min >= 0) valueField.min = this.min
            if (this.max >= 0) valueField.max = this.max
            if (this.step >= 0 ) valueField.step = this.step
            valueField.inputMode = 'decimal'
            valueField.addEventListener('input', (e) => {
                latestInput = e.target
                this.value = valueField.value // update the back-end value for further calculations
            })
        }
        // special class for QTY
        if (this.label === 'QTY') {valueField.className='yellow'}
        valueField.classList.add(this.format)
        
        // append DIV to its group
        div.append(labelField)
        div.append(valueField)
        switch(this.group) {
            case 'red':
                groupRed.append(div)
                break
            case 'green':
                groupGreen.append(div)
                break
            case 'white':
                groupWhite.append(div)
                break
        }

        return div
        
    }
}   

// Group 1 - white
let price = new Variable('Price', 'input', 'white', 0.00, 'currency', 0, undefined, 0.001)
let positionCost = new Variable('Position Cost', 'input', 'white', 0.00, 'currency', 0, undefined, 0.001)
let leverage = new Variable('Leverage', 'input', 'white', 1, 'qty', 1, 150, 1)
let positionLeveraged = new Variable('Cost Leveraged', 'output', 'white', 0.00, 'currency')
let qty = new Variable('QTY', 'input', 'white', 0, 'qty', 0, undefined, 0.1)
// Group 2 - red
let liquidationPercentage = new Variable('Liquidation %', 'output', 'red', 0.00, 'percent')
let liquidationPriceHalf = new Variable('Half loss at', 'output', 'red', 0.00, 'currency')
let liquidationPrice = new Variable('Liquidation price', 'input', 'red', 0, 'currency', 0, undefined, 0.01)
// Group 3 - green
let targetPrice1 = new Variable('Target 1', 'input', 'green', 0.00, 'currency', 0, undefined, 0.001)
let targetPrice2 = new Variable('Target 2', 'input', 'green', 0.00, 'currency', 0, undefined, 0.001)
let targetProfit1 = new Variable('Gain at Target 1', 'output', 'green', 0.00, 'currency')
let targetProfit2 = new Variable('Gain at Target 2', 'output', 'green', 0.00, 'currency')
let long = {'v':true} // TODO: VARIABLE THIS
let commissionRate = {'v': 0.01} // todo



// CALCULATIONS

let latestInput

function math(str) {
    // exact-math.js is imported
    return exactMath.formula(str)}
function round(str, places) {
    // exact-math.js is imported
    return exactMath.round(str, places)}

function calculate(e) {
    switch(latestInput) {
        case qty.htmlDiv.lastElementChild:
            // if QTY is changed
            positionCost.setVal = math(`${price.v} * ${qty.v} / ${leverage.v}`)
            positionLeveraged.setVal = math(`${price.v} * ${qty.v}`)
            break
        case liquidationPrice.htmlDiv.lastElementChild:
            // if Liquidation Price is changed; calculating Leverage
            leverage.setVal = math(`1 / (1 - ${liquidationPrice.v} / ${price.v})`)
            //leverage.setVal = Math.max(1, 1 / (1 - liquidationPrice.v / price.v ))
            positionLeveraged.setVal = math(`${positionCost.v} * ${leverage.v}`)
            qty.setVal = math(`${positionLeveraged.v} / ${price.v}`)
            break
        default:
            // if Leverage, PositionCost or Price is changed
            positionLeveraged.setVal = math(`${positionCost.v} * ${leverage.v}`)
            qty.setVal = math(`${positionLeveraged.v} / ${price.v}`)
            break

    }
    
    liquidationPercentage.setVal = math(`1.00 / ${leverage.v}`)

    if (long.v) { // long position
        liquidationPriceHalf.setVal = math(`${price.v} * (1.00 - ${liquidationPercentage.v}/2)`)
        liquidationPrice.setVal = math(`${price.v} * (1.00 - ${liquidationPercentage.v})`)
        targetProfit1.setVal = math(`(${targetPrice1.v} - ${price.v}) * ${qty.v} * (1.00 - ${commissionRate.v})`)
        targetProfit2.setVal = math(`${targetPrice2.v} - ${price.v}) * ${qty.v} * ( 1.00 - ${commissionRate.v})`)
    } else { // short position
        liquidationPriceHalf.setVal = math(`${price.v} * (1.00 + ${liquidationPercentage.v}/2)`)
        liquidationPrice.setVal = math(`${price.v} * (1.00 + ${liquidationPercentage.v})`)
        targetProfit1.setVal = math(`(${price.v} - ${targetPrice1.v}) * ${qty.v} * (1.00 - ${commissionRate.v})`)
        targetProfit2.setVal = math(`${price.v} - ${targetPrice2.v}) * ${qty.v} * ( 1.00 - ${commissionRate.v})`)
    }

    // set cookies
    let cookies = {
        'price': price.v,
        'positionCost': positionCost.v,
        'leverage': leverage.v,
        'targetPrice1': targetPrice1.v,
        'targetPrice2': targetPrice2.v 
    }
    setCookies(cookies)
    
    // prevernt page reload
    if (e) { e.preventDefault() }
}



// COOKIES

function setCookies(cookies) {
    // expiry in 30 days
    let expiry = new Date(new Date()
        .getTime()+30*24*3600*1000)
        .toGMTString() 
    document.cookie = `formdata=${JSON.stringify(cookies)}; expires=${expiry}`
}

function getCookies() {
    let cookies = document.cookie.match(new RegExp('formdata' + '=([^;]+)'));
    cookies && (cookies = JSON.parse(cookies[1]))
    if (cookies) {
        price.setVal = cookies['price']
        positionCost.setVal = cookies['positionCost']
        leverage.setVal = cookies['leverage']
        targetPrice1.setVal = cookies['targetPrice1']
        targetPrice2.setVal = cookies['targetPrice2']
    }
}



// ONLOAD

getCookies()
calculate()



// add listeners

for (inp of form.elements) {
    inp.addEventListener('input', (e) => calculate(e, inp))
}
