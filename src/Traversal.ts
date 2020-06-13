/**
 * A `Traversal` is the generalisation of an `Optional` to several targets. In other word, a `Traversal` allows to focus
 * from a type `S` into `0` to `n` values of type `A`.
 *
 * The most common example of a `Traversal` would be to focus into all elements inside of a container (e.g.
 * `ReadonlyArray`, `Option`). To do this we will use the relation between the typeclass `Traversable` and `Traversal`.
 *
 * @since 2.3.0
 */
import { Predicate, Refinement } from 'fp-ts/lib/function'
import { identity } from 'fp-ts/lib/Identity'
import { Option } from 'fp-ts/lib/Option'
import { pipe } from 'fp-ts/lib/pipeable'
import { ModifyF } from '.'
import * as I from './internal'
import { Iso } from './Iso'
import { Lens } from './Lens'
import { Optional } from './Optional'
import { Prism } from './Prism'
import { URIS, Kind } from 'fp-ts/lib/HKT'
import { Traversable1 } from 'fp-ts/lib/Traversable'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

/**
 * @category model
 * @since 2.3.0
 */
export interface Traversal<S, A> {
  readonly modifyF: ModifyF<S, A>
}

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

/**
 * Create a `Traversal` from a `Traversable`
 *
 * @category constructor
 * @since 2.3.0
 */
export const fromTraversable = I.fromTraversable

// -------------------------------------------------------------------------------------
// compositions
// -------------------------------------------------------------------------------------

/**
 * Compose a `Traversal` with an `Iso`
 *
 * @category compositions
 * @since 2.3.0
 */
export const composeIso: <A, B>(ab: Iso<A, B>) => <S>(sa: Traversal<S, A>) => Traversal<S, B> = I.traversalComposeIso

/**
 * Compose a `Traversal` with a `Lens`
 *
 * @category compositions
 * @since 2.3.0
 */
export const composeLens: <A, B>(ab: Lens<A, B>) => <S>(sa: Traversal<S, A>) => Traversal<S, B> = I.traversalComposeLens

/**
 * Compose a `Traversal` with a `Prism`
 *
 * @category compositions
 * @since 2.3.0
 */
export const composePrism: <A, B>(ab: Prism<A, B>) => <S>(sa: Traversal<S, A>) => Traversal<S, B> =
  I.traversalComposePrism

/**
 * Compose a `Traversal` with a `Optional`
 *
 * @category compositions
 * @since 2.3.0
 */
export const composeOptional: <A, B>(ab: Optional<A, B>) => <S>(sa: Traversal<S, A>) => Traversal<S, B> =
  I.traversalComposeOptional

/**
 * Compose a `Traversal` with a `Traversal`
 *
 * @category compositions
 * @since 2.3.0
 */
export const composeTraversal: <A, B>(ab: Traversal<A, B>) => <S>(sa: Traversal<S, A>) => Traversal<S, B> =
  I.traversalComposeTraversal

// -------------------------------------------------------------------------------------
// combinators
// -------------------------------------------------------------------------------------

/**
 * @category combinators
 * @since 2.3.0
 */
export const modify = <A>(f: (a: A) => A) => <S>(sa: Traversal<S, A>): ((s: S) => S) => {
  return sa.modifyF(identity)(f)
}

/**
 * @category combinators
 * @since 2.3.0
 */
export const set = <A>(a: A): (<S>(sa: Traversal<S, A>) => (s: S) => S) => {
  return modify(() => a)
}

/**
 * @category combinators
 * @since 2.3.0
 */
export function filter<A, B extends A>(refinement: Refinement<A, B>): <S>(traversal: Traversal<S, A>) => Traversal<S, B>
export function filter<A>(predicate: Predicate<A>): <S>(traversal: Traversal<S, A>) => Traversal<S, A>
export function filter<A>(predicate: Predicate<A>): <S>(traversal: Traversal<S, A>) => Traversal<S, A> {
  return composePrism(I.prismFromPredicate(predicate))
}

/**
 * Return a `Traversal` from a `Traversal` and a prop
 *
 * @category combinators
 * @since 2.3.0
 */
export const prop = <A, P extends keyof A>(prop: P): (<S>(sa: Traversal<S, A>) => Traversal<S, A[P]>) =>
  composeLens(pipe(I.lensId<A>(), I.lensProp(prop)))

/**
 * Return a `Traversal` from a `Traversal` and a list of props
 *
 * @category combinators
 * @since 2.3.0
 */
export const props = <A, P extends keyof A>(
  ...props: P[]
): (<S>(sa: Traversal<S, A>) => Traversal<S, { [K in P]: A[K] }>) =>
  composeLens(pipe(I.lensId<A>(), I.lensProps(...props)))

/**
 * Return a `Traversal` from a `Traversal` focused on a `Option` type
 *
 * @category combinators
 * @since 2.3.0
 */
export const some: <S, A>(soa: Traversal<S, Option<A>>) => Traversal<S, A> = composePrism(I.prismFromSome())

/**
 * Return a `Traversal` from a `Traversal` focused on a `Traversable`
 *
 * @category combinators
 * @since 2.3.0
 */
export const traverse = <T extends URIS>(T: Traversable1<T>) => <S, A>(
  sta: Traversal<S, Kind<T, A>>
): Traversal<S, A> => composeTraversal(fromTraversable(T)<A>())(sta)

/**
 * Return a `Traversal` from a `Traversal` focused on a `ReadonlyArray`
 *
 * @category combinators
 * @since 2.3.0
 */
export const index = (i: number) => <S, A>(sa: Traversal<S, ReadonlyArray<A>>): Traversal<S, A> =>
  composeOptional(I.indexReadonlyArray<A>().index(i))(sa)