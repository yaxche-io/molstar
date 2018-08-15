/**
 * Copyright (c) 2018 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { Unit } from 'mol-model/structure';
import { UnitsVisual } from '..';
import { RuntimeContext } from 'mol-task'
import { markElement, getElementLoci } from './util/element';
import { Mesh } from '../../../shape/mesh';
import { MeshBuilder } from '../../../shape/mesh-builder';
import { getPolymerElementCount, PolymerTraceIterator, createCurveSegmentState, interpolateCurveSegment } from './util/polymer';
import { Vec3, Mat4 } from 'mol-math/linear-algebra';
import { SecondaryStructureType, MoleculeType } from 'mol-model/structure/model/types';
import { StructureElementIterator } from './util/location-iterator';
import { DefaultUnitsMeshProps, UnitsMeshVisual } from '../units-visual';
import { SizeThemeProps, SizeTheme } from 'mol-view/theme/size';
import { OrderedSet } from 'mol-data/int';

const t = Mat4.identity()
const sVec = Vec3.zero()
const n0 = Vec3.zero()
const n1 = Vec3.zero()
const upVec = Vec3.zero()

const depthFactor = 4
const widthFactor = 4
const heightFactor = 6

export interface PolymerDirectionWedgeProps {
    sizeTheme: SizeThemeProps
}

async function createPolymerDirectionWedgeMesh(ctx: RuntimeContext, unit: Unit, props: PolymerDirectionWedgeProps, mesh?: Mesh) {
    const polymerElementCount = getPolymerElementCount(unit)
    if (!polymerElementCount) return Mesh.createEmpty(mesh)

    const sizeTheme = SizeTheme(props.sizeTheme)

    const vertexCount = polymerElementCount * 24
    const builder = MeshBuilder.create(vertexCount, vertexCount / 10, mesh)
    const linearSegments = 1

    const state = createCurveSegmentState(linearSegments)
    const { normalVectors, binormalVectors } = state

    let i = 0
    const polymerTraceIt = PolymerTraceIterator(unit)
    while (polymerTraceIt.hasNext) {
        const v = polymerTraceIt.move()
        builder.setId(OrderedSet.findPredecessorIndex(unit.elements, v.center.element))

        const isNucleic = v.moleculeType === MoleculeType.DNA || v.moleculeType === MoleculeType.RNA
        const isSheet = SecondaryStructureType.is(v.secStrucType, SecondaryStructureType.Flag.Beta)
        const tension = (isNucleic || isSheet) ? 0.5 : 0.9

        interpolateCurveSegment(state, v, tension)

        if ((isSheet && !v.secStrucChange) || !isSheet) {
            const size = sizeTheme.size(v.center)
            const depth = depthFactor * size
            const width = widthFactor * size
            const height = heightFactor * size

            const vectors = isNucleic ? binormalVectors : normalVectors
            Vec3.fromArray(n0, vectors, 0)
            Vec3.fromArray(n1, vectors, 3)
            Vec3.normalize(upVec, Vec3.add(upVec, n0, n1))

            Mat4.targetTo(t, v.p3, v.p1, upVec)
            Mat4.mul(t, t, Mat4.rotY90Z180)
            Mat4.scale(t, t, Vec3.set(sVec, height, width, depth))
            Mat4.setTranslation(t, v.p2)
            builder.addWedge(t)
        }

        if (i % 10000 === 0 && ctx.shouldUpdate) {
            await ctx.update({ message: 'Polymer direction mesh', current: i, max: polymerElementCount });
        }
        ++i
    }

    return builder.getMesh()
}

export const DefaultPolymerDirectionProps = {
    ...DefaultUnitsMeshProps
}
export type PolymerDirectionProps = typeof DefaultPolymerDirectionProps

export function PolymerDirectionVisual(): UnitsVisual<PolymerDirectionProps> {
    return UnitsMeshVisual<PolymerDirectionProps>({
        defaultProps: DefaultPolymerDirectionProps,
        createMesh: createPolymerDirectionWedgeMesh,
        createLocationIterator: StructureElementIterator.fromGroup,
        getLoci: getElementLoci,
        mark: markElement,
        setUpdateState: () => {}
    })
}