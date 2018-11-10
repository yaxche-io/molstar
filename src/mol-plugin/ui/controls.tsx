/**
 * Copyright (c) 2018 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import * as React from 'react';
import { PluginContext } from '../context';
import { Transform, Transformer, State } from 'mol-state';
import { ParametersComponent } from 'mol-app/component/parameters';

export class Controls extends React.Component<{ plugin: PluginContext }, { id: string }> {
    state = { id: '1grm' };

    private createState = () => {
        const url = `http://www.ebi.ac.uk/pdbe/static/entry/${this.state.id.toLowerCase()}_updated.cif`;
        // const url = `https://webchem.ncbr.muni.cz/CoordinateServer/${this.state.id.toLowerCase()}/full`
        this.props.plugin._test_createState(url);
    }

    private _snap: any = void 0;
    private getSnapshot = () => {
        this._snap = this.props.plugin.state.getSnapshot();
        console.log(btoa(JSON.stringify(this._snap)));
    }
    private setSnapshot = () => {
        if (!this._snap) return;
        this.props.plugin.state.setSnapshot(this._snap);
    }

    render() {
        return <div>
            <input type='text' defaultValue={this.state.id} onChange={e => this.setState({ id: e.currentTarget.value })} />
            <button onClick={this.createState}>Create State</button><br/>
            <button onClick={() => this.props.plugin._test_centerView()}>Center View</button><br/>
            <button onClick={() => this.props.plugin._test_nextModel()}>Next Model</button><br/>
            <button onClick={() => this.props.plugin._test_playModels()}>Play Models</button><br/>
            <hr />
            <button onClick={this.getSnapshot}>Get Snapshot</button>
            <button onClick={this.setSnapshot}>Set Snapshot</button>
        </div>;
    }
}

export class _test_CreateTransform extends React.Component<{ plugin: PluginContext, nodeRef: Transform.Ref, state: State, transformer: Transformer }, { params: any }> {
    private getObj() {
        const obj = this.props.state.cells.get(this.props.nodeRef)!;
        return obj;
    }

    private getDefaultParams() {
        const p = this.props.transformer.definition.params;
        if (!p || !p.default) return { };
        const obj = this.getObj();
        if (!obj.obj) return { };
        return p.default(obj.obj, this.props.plugin);
    }

    private getParamDef() {
        const p = this.props.transformer.definition.params;
        if (!p || !p.controls) return { };
        const obj = this.getObj();
        if (!obj.obj) return { };
        return p.controls(obj.obj, this.props.plugin);
    }

    private create() {
        console.log(this.props.transformer.definition.name, this.state.params);
        this.props.plugin.applyTransform(this.props.state, this.props.nodeRef, this.props.transformer, this.state.params);
    }

    state = { params: this.getDefaultParams() }

    render() {
        const obj = this.getObj();
        if (obj.status !== 'ok') {
            // TODO filter this elsewhere
            return <div />;
        }

        const t = this.props.transformer;

        return <div key={`${this.props.nodeRef} ${this.props.transformer.id}`}>
            <div style={{ borderBottom: '1px solid #999'}}>{(t.definition.display && t.definition.display.name) || t.definition.name}</div>
            <ParametersComponent params={this.getParamDef()} values={this.state.params as any} onChange={(k, v) => {
                this.setState({ params: { ...this.state.params, [k]: v } });
            }} />
            <button onClick={() => this.create()} style={{ width: '100%' }}>Create</button>
        </div>
    }
}

export class _test_UpdateTransform extends React.Component<{ plugin: PluginContext, state: State, nodeRef: Transform.Ref }, { params: any }> {
    private getCell(ref?: string) {
        return this.props.state.cells.get(ref || this.props.nodeRef)!;
    }

    private getDefParams() {
        const cell = this.getCell();
        if (!cell) return { };
        return cell.transform.params;
    }

    private getParamDef() {
        const cell = this.getCell();
        const def = cell.transform.transformer.definition;

        if (!cell.sourceRef || !def.params || !def.params.controls) return void 0;
        const src = this.getCell(cell.sourceRef);
        if (!src || !src.obj) return void 0;

        return def.params.controls(src.obj, this.props.plugin);
    }

    private update() {
        console.log(this.props.nodeRef, this.state.params);
        this.props.plugin.updateTransform(this.props.state, this.props.nodeRef, this.state.params);
    }

    // componentDidMount() {
    //     const t = this.props.plugin.state.data.tree.nodes.get(this.props.nodeRef)!;
    //     if (t) this.setState({ params: t.value.params });
    // }

    state = { params: this.getDefParams() };

    render() {
        const cell = this.getCell();
        const transform = cell.transform;
        if (!transform || transform.ref === Transform.RootRef) {
            return <div />;
        }

        const params = this.getParamDef();
        if (!params) return <div />;

        const tr = transform.transformer;

        return <div key={`${this.props.nodeRef} ${tr.id}`}>
            <div style={{ borderBottom: '1px solid #999'}}>{(tr.definition.display && tr.definition.display.name) || tr.definition.name}</div>
            <ParametersComponent params={params} values={this.state.params as any} onChange={(k, v) => {
                this.setState({ params: { ...this.state.params, [k]: v } });
            }} />
            <button onClick={() => this.update()} style={{ width: '100%' }}>Update</button>
        </div>
    }
}