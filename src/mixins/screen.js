export default function (id, opts) {
    return function (props, ref, key) {
        return (
            <skoash.Screen
                {...props}
                ref={ref}
                key={key}
                id={id}
                {...opts}
            />
        );
    };
}
