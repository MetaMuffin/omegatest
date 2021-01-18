import { type } from "os"

export interface Test {
    name: string,
    values: { [key: string]: TValue }
    questions: TQuestion[]
}

export interface TChoice {
    name: string,
    mod: { [key: string]: string | number }
}

export interface TQuestion {
    title: string,
    description: string,
    type: "slider" | "select"
    choices?: TChoice[]
    minmax?: [number, number]
    mod?: { [key: string]: string | number }
}

export interface TValue {
    description: string
}


export async function loadTest(name: string) {
    var res = await fetch(`/static/tests/${encodeURIComponent(name)}.json`, {
        method: "GET",
        cache: "default"
    })
    if (!res.ok) throw new Error("Could not load test file");
    return JSON.parse(await res.text())
}

var qprogress: HTMLProgressElement

export async function init() {
    var test: Test = await loadTest("a")
    var values: { [key: string]: number } = {}

    for (const valname in test.values) {
        if (test.values.hasOwnProperty(valname)) {
            values[valname] = 0;
        }
    }

    var qprog = document.getElementById("q-progress")
    if (!qprog || !(qprog instanceof HTMLProgressElement)) throw new Error("Could not get progress slider");
    qprogress = qprog

    var qcontent = document.getElementById("q-content")
    for (let i = 0; i < test.questions.length; i++) {
        const q = test.questions[i];
        qprog.setAttribute("value", (i / test.questions.length * 100).toString())
        await new Promise<void>((res, rej) => {
            if (!qcontent) throw new Error("ufff");
            qcontent.innerHTML = ""
            qcontent.appendChild(buildQuestion(q, values, () => res()))
        })
    }
    qprog.setAttribute("value", "100")
    if (!qcontent) throw new Error("ufff");
    qcontent.innerHTML = ""
    qcontent.appendChild(buildResults(values, test.values))
}

export function buildResults(values: { [key: string]: number }, valdef: { [key: string]: TValue }): HTMLElement {
    var rdiv = document.createElement("div")
    var rheader = document.createElement("h2")
    rheader.textContent = "Your test results:"
    var rbars = document.createElement("div")
    rbars.classList.add("res", "cf")
    for (const valname in valdef) {
        if (valdef.hasOwnProperty(valname)) {
            const def = valdef[valname];
            const val = values[valname];
            var rrow = document.createElement("div")
            var rbar = document.createElement("div")

            rrow.classList.add("res-row")
            rbar.classList.add("res-bar")

            rbar.style.width = `${Math.min(Math.max(Math.abs(val * 10), 0), 100)}%`
            if (val < 0) rrow.classList.add("neg")
            else rrow.classList.add("pos")
            rrow.append(rbar)
            rbars.appendChild(rrow)
        }
    }
    rdiv.append(rheader, rbars)

    return rdiv
}


export function buildQuestion(q: TQuestion, values: { [key: string]: number }, ondone: () => any): HTMLElement {
    var qdiv = document.createElement("div")
    qdiv.classList.add("q-content-inner")

    var qheader = document.createElement("h3")
    qheader.textContent = q.title
    var qdescription = document.createElement("p")
    qdescription.textContent = q.description
    var qsubmit = document.createElement("input")
    qsubmit.type = "button"
    qsubmit.value = "Next >"

    var qinput = document.createElement("div")
    if (q.type == "select" && q.choices) {
        var qselect = document.createElement("select")
        for (let i = 0; i < q.choices.length; i++) {
            const choice = q.choices[i];
            var qchoice = document.createElement("option")
            qchoice.value = i.toString()
            qchoice.textContent = choice.name
            qselect.appendChild(qchoice)
        }
        var val = 0
        qselect.onchange = () => {
            val = parseInt(qselect.value)
        }
        qsubmit.onclick = () => {
            if (!q.choices) return
            var mods = q.choices[val].mod
            for (const valname in mods) {
                if (mods.hasOwnProperty(valname)) {
                    const mod = mods[valname]
                    var value = 0
                    if (typeof mod == "number") {
                        value = mod
                    } else {
                        value = new Function("return " + mod + ";")()
                    }
                    values[valname] += value
                }
            }
            ondone()
        }
        qinput.appendChild(qselect)
    } else if (q.type == "slider" && q.minmax && q.mod) {
        var qslider = document.createElement("input")
        qslider.type = "range"
        qslider.min = "" + q.minmax[0]
        qslider.max = "" + q.minmax[1]
        qslider.value = "0"
        var slider_value = 0
        qslider.onchange = () => {
            slider_value = parseFloat(qslider.value)
        }
        qsubmit.onclick = () => {
            for (const valname in q.mod) {
                if (q.mod.hasOwnProperty(valname)) {
                    const mod = q.mod[valname]
                    var value = 0
                    if (typeof mod == "number") {
                        value = mod
                    } else {
                        value = new Function(`var v = ${slider_value}; return ${mod};`)()
                    }
                    values[valname] += value
                }
            }
            ondone()
        }
        qinput.appendChild(qslider)
    }
    qdiv.append(qheader, qdescription, qinput, qsubmit)
    return qdiv
}

window.onload = () => init()