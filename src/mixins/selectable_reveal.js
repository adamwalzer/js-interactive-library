export default function (props, opts = {}) {
    return (
        <$k.Component>
            <$k.MediaCollection
                play={_.get(props, 'data.reveal.open')}
            />
            <$k.Selectable
                dataTarget="selectable"
                {...opts.SelectableProps}
            />
            <$k.Reveal
                openTarget="reveal"
                openReveal={_.get(props, 'data.selectable.target.props.data-ref')}
                {...opts.RevealProps}
            />
        </$k.Component>
    );
}
